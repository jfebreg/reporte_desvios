const tls = require("node:tls");

function getMailerStatus() {
  const gmailConfigured = isGmailConfigured();
  const sendGridConfigured = isSendGridConfigured();
  const provider = gmailConfigured ? "gmail" : sendGridConfigured ? "sendgrid" : "simulado";
  return {
    provider,
    from: mailFrom(),
    configured: gmailConfigured || sendGridConfigured,
    gmailConfigured,
    sendGridConfigured
  };
}

async function sendMail({ to, subject, body }) {
  if (isGmailConfigured()) {
    return sendGmailSmtp({ to, subject, body });
  }

  if (isSendGridConfigured()) {
    return sendSendGrid({ to, subject, body });
  }

  return { status: "simulated", provider: "simulado" };
}

async function sendSendGrid({ to, subject, body }) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: mailFrom() },
      subject,
      content: [{ type: "text/plain", value: body }]
    })
  });

  if (!response.ok) {
    throw new Error(`SendGrid fallo ${response.status}: ${await response.text()}`);
  }

  return {
    status: "sent",
    provider: "sendgrid",
    providerMessageId: response.headers.get("x-message-id") || ""
  };
}

async function sendGmailSmtp({ to, subject, body }) {
  const smtp = await openSmtpConnection();
  const from = mailFrom();
  try {
    await smtp.expect(220);
    await smtp.command(`EHLO ${process.env.SMTP_HELO || "reporte-desvios.local"}`, 250);
    await smtp.command("AUTH LOGIN", 334);
    await smtp.command(Buffer.from(process.env.GMAIL_USER).toString("base64"), 334);
    await smtp.command(Buffer.from(gmailAppPassword()).toString("base64"), 235);
    await smtp.command(`MAIL FROM:<${from}>`, 250);
    await smtp.command(`RCPT TO:<${to}>`, [250, 251]);
    await smtp.command("DATA", 354);
    await smtp.command(formatMessage({ from, to, subject, body }), 250);
    await smtp.command("QUIT", 221);
    return { status: "sent", provider: "gmail", providerMessageId: "" };
  } finally {
    smtp.close();
  }
}

function openSmtpConnection() {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      servername: process.env.SMTP_HOST || "smtp.gmail.com",
      rejectUnauthorized: true
    });
    const smtp = createSmtpClient(socket);
    socket.once("secureConnect", () => resolve(smtp));
    socket.once("error", reject);
    socket.setTimeout(20000, () => {
      socket.destroy();
      reject(new Error("Gmail SMTP no respondio dentro del tiempo esperado."));
    });
  });
}

function createSmtpClient(socket) {
  let buffer = "";
  const waiters = [];

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    flushWaiters();
  });
  socket.on("error", (error) => rejectPending(error));
  socket.on("close", () => rejectPending(new Error("Gmail SMTP cerro la conexion antes de responder.")));

  function flushWaiters() {
    while (waiters.length && hasCompleteReply(buffer)) {
      const waiter = waiters.shift();
      const reply = takeReply();
      waiter.resolve(reply);
    }
  }

  function takeReply() {
    const lines = buffer.split(/\r?\n/);
    let endIndex = -1;
    for (let index = 0; index < lines.length; index += 1) {
      if (/^\d{3} /.test(lines[index])) {
        endIndex = index;
        break;
      }
    }
    const replyLines = lines.slice(0, endIndex + 1);
    buffer = lines.slice(endIndex + 1).join("\n");
    return replyLines.join("\n");
  }

  function readReply() {
    return new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
      flushWaiters();
    });
  }

  async function expect(expectedCodes) {
    const reply = await readReply();
    assertReply(reply, expectedCodes);
    return reply;
  }

  async function command(commandText, expectedCodes) {
    socket.write(`${commandText}\r\n`);
    return expect(expectedCodes);
  }

  return {
    expect,
    command,
    close() {
      socket.end();
    }
  };

  function rejectPending(error) {
    while (waiters.length) {
      const waiter = waiters.shift();
      waiter.reject(error);
    }
  }
}

function hasCompleteReply(text) {
  return text.split(/\r?\n/).some((line) => /^\d{3} /.test(line));
}

function assertReply(reply, expectedCodes) {
  const expected = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];
  const code = Number(reply.slice(0, 3));
  if (!expected.includes(code)) {
    throw new Error(`Gmail SMTP fallo ${code}: ${reply}`);
  }
}

function formatMessage({ from, to, subject, body }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit"
  ];
  return `${headers.join("\r\n")}\r\n\r\n${dotStuff(body)}\r\n.`;
}

function dotStuff(text) {
  return String(text || "").replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value || ""), "utf8").toString("base64")}?=`;
}

function mailFrom() {
  return process.env.MAIL_FROM || process.env.GMAIL_USER || "";
}

function isGmailConfigured() {
  const password = gmailAppPassword();
  return Boolean(process.env.GMAIL_USER && password && password !== "disabled" && mailFrom());
}

function gmailAppPassword() {
  return String(process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
}

function isSendGridConfigured() {
  const apiKey = process.env.SENDGRID_API_KEY || "";
  return Boolean(apiKey && apiKey !== "disabled" && mailFrom());
}

module.exports = { getMailerStatus, sendMail };

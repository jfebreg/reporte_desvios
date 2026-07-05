function getMailerStatus() {
  const configured = isSendGridConfigured();
  return {
    provider: configured ? "sendgrid" : "simulado",
    from: process.env.MAIL_FROM || "",
    configured
  };
}

async function sendMail({ to, subject, body }) {
  if (!isSendGridConfigured()) {
    return { status: "simulated", provider: "simulado" };
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.MAIL_FROM },
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

function isSendGridConfigured() {
  const apiKey = process.env.SENDGRID_API_KEY || "";
  return Boolean(apiKey && apiKey !== "disabled" && process.env.MAIL_FROM);
}

module.exports = { getMailerStatus, sendMail };

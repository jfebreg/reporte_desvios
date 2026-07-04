function getMailerStatus() {
  return {
    provider: process.env.SENDGRID_API_KEY ? "sendgrid" : "simulado",
    from: process.env.MAIL_FROM || "",
    configured: Boolean(process.env.SENDGRID_API_KEY && process.env.MAIL_FROM)
  };
}

async function sendMail({ to, subject, body }) {
  if (!process.env.SENDGRID_API_KEY || !process.env.MAIL_FROM) {
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

module.exports = { getMailerStatus, sendMail };

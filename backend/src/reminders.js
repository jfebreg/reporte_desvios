const { sendMail } = require("./mailer");

async function runReminderJob(state) {
  const today = todayIso();
  const emails = state.emails || [];
  const findings = state.findings || [];
  let created = 0;

  for (const finding of findings) {
    if (!finding.ownerId || !finding.dueDate) continue;
    if (["Cerrado", "Completado por responsable", "No procesable"].includes(finding.status)) continue;

    const owner = (state.people || []).find((person) => person.id === finding.ownerId);
    if (!owner?.email) continue;

    const daysToDue = diffDays(finding.dueDate, today);
    let subject = "";
    let body = "";

    if (daysToDue < 0) {
      subject = `Hallazgo vencido ${finding.id}`;
      body = `${finding.site || "Obra"} - ${finding.location || "Sin ubicacion"} vencio el ${finding.dueDate}.`;
      if (finding.status !== "Vencido") finding.status = "Vencido";
    } else if (daysToDue <= 3) {
      subject = `Hallazgo proximo a vencer ${finding.id}`;
      body = `${finding.site || "Obra"} - ${finding.location || "Sin ubicacion"} vence el ${finding.dueDate}.`;
    } else {
      continue;
    }

    if (alreadyQueued(emails, owner.email, subject, today)) continue;

    const email = {
      at: today,
      to: owner.email,
      subject,
      body,
      status: "pending",
      provider: "",
      providerMessageId: "",
      errorMessage: ""
    };

    try {
      const result = await sendMail({ to: owner.email, subject, body });
      email.status = result.status;
      email.provider = result.provider;
      email.providerMessageId = result.providerMessageId || "";
    } catch (error) {
      email.status = "failed";
      email.errorMessage = error.message;
    }

    emails.unshift(email);
    finding.history = finding.history || [];
    finding.history.push({
      at: today,
      actor: "Sistema",
      detail: `Recordatorio generado: ${subject}`
    });
    created += 1;
  }

  state.emails = emails;
  state.imports = state.imports || [];
  state.imports.unshift({ at: today, detail: `${created} recordatorios procesados por backend.` });

  return { state, created };
}

function alreadyQueued(emails, to, subject, date) {
  return emails.some((email) => email.to === to && email.subject === subject && email.at === date);
}

function diffDays(date, baseDate) {
  const target = new Date(`${date}T00:00:00`);
  const base = new Date(`${baseDate}T00:00:00`);
  return Math.ceil((target - base) / 86400000);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { runReminderJob };

const { writeState } = require("../src/store");

const today = new Date().toISOString().slice(0, 10);

const state = {
  findings: [],
  people: [
    { id: "u-admin", name: "Administrador", role: "admin", email: "admin@empresa.cl", area: "Prevencion" }
  ],
  emails: [],
  imports: [{ at: today, detail: "Base inicial creada desde script seed." }],
  actionCriteria: [
    { id: "inmediata", label: "inmediata", days: 0, priority: "Alta" },
    { id: "3-dias", label: "3 dias", days: 3, priority: "Media" },
    { id: "1-semana", label: "1 semana", days: 7, priority: "Baja" },
    { id: "2-semanas", label: "2 semanas", days: 14, priority: "Baja" }
  ],
  settings: {
    formUrl: "https://forms.google.com/",
    defaultSite: "Aduccion Lyon Valparaiso / Terratunel SpA",
    sites: ["Aduccion Lyon Valparaiso / Terratunel SpA"]
  }
};

writeState(state)
  .then(() => console.log("Estado inicial creado en backend/data/state.json"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

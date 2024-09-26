const {
  addUsedConfig,
  setActiveConfig,
  getUsedConfigs,
  addDeployedToken,
} = require("../helpers/fileHelpers");
const { toStyle } = require("../helpers/loggingHelper");

// Tâche pour changer activeConfig
task("set-active-config", "Change le activeConfig")
  .addParam("name", "Le nom du nouveau activeConfig")
  .setAction(async (taskArgs) => {
    try {
      setActiveConfig(taskArgs.name);
      console.log(
        `${toStyle.bold("activeConfig")} changé en '${toStyle.blueItalic(
          taskArgs.name
        )}' avec succès !`
      );
    } catch (error) {
      console.error(error.message);
    }
  });

// Tâche pour ajouter un nouveau usedConfig
task("add-used-config", "Ajoute un nouveau usedConfig")
  .addParam("name", "Le nom du usedConfig")
  .addParam("networks", "Le tableau de réseaux (séparés par des virgules)")
  .addParam("tokens", "Le tableau de tokens (séparés par des virgules)")
  .setAction(async (taskArgs) => {
    const networksArray = taskArgs.networks
      .split(",")
      .map((item) => item.trim());
    const tokensArray = taskArgs.tokens.split(",").map((item) => item.trim());

    try {
      await addUsedConfig(taskArgs.name, networksArray, tokensArray); // Attendre l'exécution de la fonction
      console.log(
        `${toStyle.bold("Nouveau usedConfig")} '${toStyle.blueItalic(
          taskArgs.name
        )}' ajouté avec succès !`
      );
    } catch (error) {
      console.error(`Erreur lors de l'ajout du usedConfig : ${error.message}`);
    }
  });

// Tâche pour afficher les usedConfigs (optionnel, pour vérification)
task("list-used-configs", "Affiche les usedConfigs disponible").setAction(
  async () => {
    const usedConfigs = getUsedConfigs();
    console.log(
      `${toStyle.bold("Listed usedConfig")}: ${JSON.stringify(
        usedConfigs,
        null,
        2
      )}`
    );
  }
);

task(
  "add-deployed-token",
  "Ajoute un nouveau deployedToken à un réseau existant"
)
  .addParam("net", "Le nom du réseau")
  .addParam(
    "name",
    "Le nom du token, if mocked MUST contains be prefixed with 'mocked'"
  )
  .addParam("symbol", "Le symbole du token")
  .addOptionalParam(
    "address",
    "L'adresse du token (name shouldn't contain 'mocked')"
  )
  .setAction(async (taskArgs) => {
    try {
      addDeployedToken(
        taskArgs.net,
        taskArgs.name,
        taskArgs.symbol,
        taskArgs.address
      );
      console.log(
        `Le token '${taskArgs.name}' a été ajouté avec succès au réseau '${taskArgs.net}'.`
      );
    } catch (error) {
      console.error(`Erreur lors de l'ajout du token : ${error.message}`);
    }
  });

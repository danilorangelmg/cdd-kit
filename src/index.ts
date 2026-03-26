import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addModuleCommand } from "./commands/add-module.js";
import { addStackCommand } from "./commands/add-stack.js";
import { doctorCommand } from "./commands/doctor.js";

const program = new Command();

program
  .name("cdd")
  .description(
    "Copilot-Driven Development — Metodologia para desenvolvimento AI-augmented com Claude Code"
  )
  .version("0.6.0");

program
  .command("init")
  .description("Inicializa um novo projeto com a metodologia CDD")
  .argument("[directory]", "Diretorio do projeto (default: diretorio atual)")
  .action(initCommand);

program
  .command("add-module")
  .description("Adiciona um novo modulo ao projeto existente")
  .action(addModuleCommand);

program
  .command("add-stack")
  .description("Adiciona ou troca a stack de um modulo existente")
  .action(addStackCommand);

program
  .command("doctor")
  .description("Valida a estrutura do projeto CDD")
  .action(doctorCommand);

program.parse();

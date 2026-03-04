import * as p from "@clack/prompts";
import chalk from "chalk";
import { PRESETS } from "../methodology/presets.js";
import { ROLES } from "../methodology/roles.js";
import { RULES } from "../methodology/rules.js";
import type { ModuleConfig, ProjectConfig } from "../utils/validation.js";

export async function runInitPrompts(
  targetDir?: string
): Promise<ProjectConfig> {
  p.intro(chalk.bgCyan(" cdd ") + " Copilot-Driven Development");

  // Step 1: Project info
  const projectGroup = await p.group(
    {
      name: () =>
        p.text({
          message: "Nome do projeto:",
          placeholder: "meu-projeto",
          validate: (v) => {
            if (!v.trim()) return "Nome obrigatorio";
            if (!/^[a-z0-9-]+$/.test(v))
              return "Use apenas letras minusculas, numeros e hifens";
          },
        }),
      description: () =>
        p.text({
          message: "Descricao curta:",
          placeholder: "Sistema de gestao de pedidos",
        }),
      language: () =>
        p.select({
          message: "Idioma da documentacao:",
          options: [
            { value: "pt-BR", label: "Portugues BR" },
            { value: "en", label: "English" },
          ],
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operacao cancelada.");
        process.exit(0);
      },
    }
  );

  // Step 2: Modules
  const modules: ModuleConfig[] = [];
  let addMore = true;

  p.log.info(chalk.bold("Modulos do projeto"));
  p.log.message(
    "Adicione os modulos (submicro-servicos) do seu projeto. Cada modulo tera seu proprio CLAUDE.md e agente delegado."
  );

  while (addMore) {
    const mod = await p.group(
      {
        name: () =>
          p.text({
            message: `Nome do modulo ${modules.length + 1}:`,
            placeholder: "frontend",
            validate: (v) => {
              if (!v.trim()) return "Nome obrigatorio";
              if (modules.some((m) => m.name === v))
                return "Ja existe um modulo com esse nome";
            },
          }),
        role: () =>
          p.select({
            message: "Role do modulo:",
            options: ROLES.map((r) => ({
              value: r.id,
              label: r.label,
              hint: r.description,
            })),
          }),
      },
      {
        onCancel: () => {
          p.cancel("Operacao cancelada.");
          process.exit(0);
        },
      }
    );

    modules.push({
      name: mod.name as string,
      role: mod.role as ModuleConfig["role"],
      directory: mod.name as string,
    });

    p.log.success(`Modulo ${chalk.bold(mod.name)} (${mod.role}) adicionado.`);

    const continueAdding = await p.confirm({
      message: "Adicionar outro modulo?",
      initialValue: modules.length < 2,
    });

    if (p.isCancel(continueAdding)) {
      p.cancel("Operacao cancelada.");
      process.exit(0);
    }

    addMore = continueAdding as boolean;
  }

  if (modules.length === 0) {
    p.log.warn("Nenhum modulo adicionado. Adicionando modulo generico.");
    modules.push({ name: "app", role: "generic", directory: "app" });
  }

  // Step 3: Methodology preset
  const presetChoice = await p.select({
    message: "Preset de metodologia:",
    options: [
      ...PRESETS.map((preset) => ({
        value: preset.id,
        label: preset.label,
        hint: preset.description,
      })),
      {
        value: "custom",
        label: "Custom",
        hint: "Escolher regra por regra",
      },
    ],
  });

  if (p.isCancel(presetChoice)) {
    p.cancel("Operacao cancelada.");
    process.exit(0);
  }

  let rules: Record<string, boolean>;
  let presetId: string;

  if (presetChoice === "custom") {
    presetId = "custom";
    const customizableRules = RULES.filter((r) => !r.alwaysActive);

    const selectedRules = await p.multiselect({
      message: "Quais componentes de metodologia ativar?",
      options: customizableRules.map((r) => ({
        value: r.id,
        label: `Regra #${r.number} — ${r.name}`,
        hint: r.description,
      })),
      required: false,
    });

    if (p.isCancel(selectedRules)) {
      p.cancel("Operacao cancelada.");
      process.exit(0);
    }

    const selected = selectedRules as string[];
    rules = {};
    for (const rule of RULES) {
      rules[rule.id] = rule.alwaysActive || selected.includes(rule.id);
    }
  } else {
    presetId = presetChoice as string;
    const preset = PRESETS.find((p) => p.id === presetChoice)!;
    rules = { ...preset.rules };
  }

  // Summary
  const activeRuleNames = RULES.filter(
    (r) => r.alwaysActive || rules[r.id]
  ).map((r) => `#${r.number} ${r.name}`);

  p.note(
    [
      `Projeto: ${chalk.bold(projectGroup.name)}`,
      `Modulos: ${modules.map((m) => `${m.name} (${m.role})`).join(", ")}`,
      `Regras: ${activeRuleNames.join(", ")}`,
    ].join("\n"),
    "Resumo"
  );

  const confirmed = await p.confirm({
    message: "Confirmar e gerar projeto?",
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Operacao cancelada.");
    process.exit(0);
  }

  return {
    version: "1.0.0",
    project: {
      name: projectGroup.name as string,
      description: (projectGroup.description as string) || "",
      language: projectGroup.language as "pt-BR" | "en",
    },
    modules,
    methodology: {
      preset: presetId,
      rules,
    },
  };
}

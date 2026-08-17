/**
 * Cuban higher-education institutions, grouped by province slug.
 *
 * EDITING THIS LIST: it's a plain object — add, rename or remove entries freely
 * and the whole app (post form, filters, labels) follows automatically. The list
 * covers each province's main universities; if a student's institution is missing
 * they can still pick "Otra" and type it, so nobody is ever blocked.
 */
export const UNIVERSITIES: Record<string, string[]> = {
  "pinar-del-rio": [
    "Universidad de Pinar del Río «Hermanos Saíz Montes de Oca»",
    "Universidad de Ciencias Médicas de Pinar del Río",
  ],
  artemisa: [
    "Universidad de Artemisa",
    "Facultad de Ciencias Médicas de Artemisa",
  ],
  "la-habana": [
    "Universidad de La Habana (UH)",
    "Universidad Tecnológica de La Habana «José Antonio Echeverría» (CUJAE)",
    "Universidad de Ciencias Informáticas (UCI)",
    "Universidad de Ciencias Médicas de La Habana",
    "Universidad de las Artes (ISA)",
    "Instituto Superior de Diseño (ISDi)",
    "Universidad de Ciencias de la Cultura Física y el Deporte «Manuel Fajardo»",
    "Instituto Superior de Relaciones Internacionales (ISRI)",
  ],
  mayabeque: [
    "Universidad Agraria de La Habana «Fructuoso Rodríguez Pérez» (UNAH)",
    "Universidad de Ciencias Médicas de Mayabeque",
  ],
  matanzas: [
    "Universidad de Matanzas «Camilo Cienfuegos»",
    "Universidad de Ciencias Médicas de Matanzas",
  ],
  cienfuegos: [
    "Universidad de Cienfuegos «Carlos Rafael Rodríguez»",
    "Universidad de Ciencias Médicas de Cienfuegos",
  ],
  "villa-clara": [
    "Universidad Central «Marta Abreu» de Las Villas (UCLV)",
    "Universidad de Ciencias Médicas de Villa Clara",
  ],
  "sancti-spiritus": [
    "Universidad de Sancti Spíritus «José Martí Pérez» (UNISS)",
    "Universidad de Ciencias Médicas de Sancti Spíritus",
  ],
  "ciego-de-avila": [
    "Universidad de Ciego de Ávila «Máximo Gómez Báez» (UNICA)",
    "Universidad de Ciencias Médicas de Ciego de Ávila",
  ],
  camaguey: [
    "Universidad de Camagüey «Ignacio Agramonte Loynaz»",
    "Universidad de Ciencias Médicas de Camagüey",
  ],
  "las-tunas": [
    "Universidad de Las Tunas",
    "Universidad de Ciencias Médicas de Las Tunas",
  ],
  holguin: [
    "Universidad de Holguín «Oscar Lucero Moya»",
    "Universidad de Ciencias Médicas de Holguín",
  ],
  granma: [
    "Universidad de Granma",
    "Universidad de Ciencias Médicas de Granma",
  ],
  "santiago-de-cuba": [
    "Universidad de Oriente",
    "Universidad de Ciencias Médicas de Santiago de Cuba",
  ],
  guantanamo: [
    "Universidad de Guantánamo",
    "Universidad de Ciencias Médicas de Guantánamo",
  ],
  "isla-de-la-juventud": [
    "Universidad «Jesús Montané Oropesa»",
    "Facultad de Ciencias Médicas de la Isla de la Juventud",
  ],
};

/**
 * Faculties found across Cuban universities. Kept as one shared list rather than
 * pretending to know the exact departments of every institution — students pick
 * the closest match, or "Otra".
 */
export const FACULTIES = [
  "Ingeniería Informática",
  "Ingeniería Civil",
  "Ingeniería Mecánica",
  "Ingeniería Eléctrica",
  "Ingeniería Industrial",
  "Ingeniería Química",
  "Arquitectura",
  "Medicina",
  "Estomatología",
  "Enfermería",
  "Tecnología de la Salud",
  "Ciencias Agropecuarias",
  "Ciencias Económicas",
  "Contabilidad y Finanzas",
  "Turismo",
  "Derecho",
  "Psicología",
  "Comunicación Social",
  "Periodismo",
  "Artes y Letras",
  "Filosofía e Historia",
  "Lenguas Extranjeras",
  "Matemática y Computación",
  "Física",
  "Química",
  "Biología",
  "Geografía",
  "Educación / Pedagogía",
  "Cultura Física y Deporte",
  "Otra",
] as const;

export function universitiesFor(provinceSlug: string | null | undefined) {
  return (provinceSlug && UNIVERSITIES[provinceSlug]) || [];
}

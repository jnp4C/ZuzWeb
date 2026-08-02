function media(slug, name, en, cs) {
  const base = `./assets/project-pages/${slug}/${name}`;
  return {
    src: `${base}-1800.webp`,
    srcset: `${base}-1100.webp 1100w, ${base}-1800.webp 1800w`,
    alt: { en, cs },
  };
}

function section(id, kind, en, cs, items) {
  return { id, kind, label: { en, cs }, media: items };
}

const CURATED_MEDIA = {
  waterscape: {
    hero: media("waterscape", "index", "Waterscape project index drawing", "Indexová kresba projektu Waterscape"),
    sections: [
      section("situation", "masterplan", "Situation", "Situace", [1, 2, 3, 4].map((number) => media(
        "waterscape",
        `source-situation-${String(number).padStart(2, "0")}`,
        `Waterscape situation ${number}`,
        `Situace Waterscape ${number}`,
      ))),
      section("sections", "graphic", "Sections", "Řezy", [1, 2, 3, 4, 5, 6].map((number) => media(
        "waterscape",
        `source-section-${String(number).padStart(2, "0")}`,
        `Waterscape section ${number}`,
        `Řez Waterscape ${number}`,
      ))),
      section("model", "model", "Model", "Model", [1, 2, 3, 4].map((number) => media(
        "waterscape",
        `source-model-${String(number).padStart(2, "0")}`,
        `Waterscape model ${number}`,
        `Model Waterscape ${number}`,
      ))),
    ],
  },
  "cycle-of-change": {
    hero: media("cycle-of-change", "index", "Cycle of Change index graphic", "Indexová grafika projektu Cyklus proměny"),
    sections: [
      section("situation", "masterplan", "Situation", "Situace", [
        media("cycle-of-change", "situation", "Cycle of Change situation", "Situace projektu Cyklus proměny"),
      ]),
      section("wider-relations", "graphic", "Wider relations", "Širší vztahy", [
        media("cycle-of-change", "wider-relations", "Wider landscape relations", "Širší krajinné vztahy"),
      ]),
      section("sections", "graphic", "Sections", "Řezy", [1, 2, 3].map((number) => media(
        "cycle-of-change",
        `section-0${number}`,
        `Cycle of Change section ${number}`,
        `Řez projektu Cyklus proměny ${number}`,
      ))),
      section("documentation", "graphic", "Documentation selection", "Výběr z dokumentace", [1, 2, 3, 4].map((number) => media(
        "cycle-of-change",
        `documentation-0${number}`,
        `Cycle of Change documentation ${number}`,
        `Dokumentace projektu Cyklus proměny ${number}`,
      ))),
    ],
  },
  semnevision: {
    hero: media("semnevice", "index", "Semněvice landscape concept sketch", "Skica koncepce krajiny Semněvic"),
    sections: [
      section("iso", "graphic", "ISO", "ISO", [
        {
          src: "./assets/project-pages/semnevice/iso-1800.webp",
          srcset: "./assets/project-pages/semnevice/iso-1200.webp 1200w, ./assets/project-pages/semnevice/iso-1800.webp 1800w",
          alt: { en: "Exploded isometric landscape concept for Semněvice", cs: "Rozložená izometrie koncepce krajiny Semněvic" },
        },
      ]),
      section("masterplan", "masterplan", "Masterplan", "Masterplan", [
        {
          src: "./assets/project-pages/semnevice/masterplan-1800.webp",
          srcset: "./assets/project-pages/semnevice/masterplan-1200.webp 1200w, ./assets/project-pages/semnevice/masterplan-1800.webp 1800w",
          alt: { en: "Landscape masterplan for Semněvice", cs: "Masterplan koncepce krajiny Semněvic" },
        },
      ]),
      section("analysis-examples", "graphic", "Analysis examples", "Ukázka analýz", [
        media("semnevice", "analysis", "Examples of Semněvice landscape analyses", "Ukázka analýz krajiny Semněvic"),
      ]),
    ],
  },
  rewaterization: {
    hero: media("rewaterization", "index", "Rewaterization project visualization", "Vizualizace projektu Revodalizace"),
    sections: [
      section("process", "graphic", "Process", "Proces", [
        media("rewaterization", "process", "Rewaterization project process", "Proces projektu Revodalizace"),
      ]),
      section("stream-revitalization", "graphic", "Stream revitalization", "Revitalizace toku", [
        media("rewaterization", "stream-revitalization", "Technical proposal for stream revitalization", "Technický návrh revitalizace toku"),
        media("rewaterization", "water-reservoir", "Existing state and proposed water reservoir", "Současný stav a návrh vodní nádrže"),
      ]),
      section("proposal", "masterplan", "Proposal", "Návrh", [
        media("rewaterization", "visualization", "Rewaterization proposal visualization", "Vizualizace návrhu Revodalizace"),
        media("rewaterization", "landscape-plan", "Annotated landscape proposal", "Popsaný krajinářský návrh"),
      ]),
    ],
  },
  "steep-garden": {
    hero: media("steep-garden", "index", "Steep Garden visualization", "Vizualizace Zahrady ve svahu"),
    sections: [
      section("visualization", "graphic", "Visualization", "Vizualizace", [
        media("steep-garden", "visualization", "Steep Garden visualization", "Vizualizace Zahrady ve svahu"),
      ]),
      section("axonometry", "graphic", "Axonometry", "Axonometrie", [
        media("steep-garden", "axonometry", "Steep Garden axonometry", "Axonometrie Zahrady ve svahu"),
        media("steep-garden", "axonometry-annotated", "Annotated Steep Garden axonometry", "Popsaná axonometrie Zahrady ve svahu"),
      ]),
      section("documentation", "graphic", "Documentation selection", "Výběr z dokumentace", [1, 2, 3].map((number) => media(
        "steep-garden",
        `documentation-0${number}`,
        `Steep Garden documentation ${number}`,
        `Dokumentace Zahrady ve svahu ${number}`,
      ))),
    ],
  },
  "growing-through": {
    hero: media("growing-through", "index", "Growing-Through installation visualization", "Vizualizace instalace Growing-Through"),
    sections: [
      section("visualizations", "graphic", "Visualizations", "Vizualizace", [
        media("growing-through", "visualization", "Growing-Through visualization", "Vizualizace Growing-Through"),
        media("growing-through", "visualization-detail", "Growing-Through detail visualization", "Detailní vizualizace Growing-Through"),
      ]),
      section("situation-and-section", "masterplan", "Situation and section", "Situace a řez", [
        media("growing-through", "situation", "Growing-Through situation", "Situace Growing-Through"),
        media("growing-through", "section", "Growing-Through section", "Řez Growing-Through"),
      ]),
      section("growth-diagram", "graphic", "Growth diagram", "Schéma růstu", [
        media("growing-through", "growth-diagram", "Growing-Through growth diagram", "Schéma růstu Growing-Through"),
      ]),
    ],
  },
  abstract: {
    hero: media("abstract", "index", "Abstract project perspective", "Perspektiva projektu Abstract"),
    sections: [
      section("perspectives", "graphic", "Perspectives", "Perspektivy", [2, 3].map((number) => media(
        "abstract",
        `perspective-0${number}`,
        `Abstract project perspective ${number}`,
        `Perspektiva projektu Abstract ${number}`,
      ))),
      section("masterplan", "masterplan", "Masterplan", "Masterplan", [
        media("abstract", "masterplan", "Abstract project masterplan", "Masterplan projektu Abstract"),
        media("abstract", "detail-plan", "Abstract project detail plan", "Detailní plán projektu Abstract"),
      ]),
      section("model", "model", "Model", "Model", [1, 2, 3, 4, 5, 6].map((number) => media(
        "abstract",
        `model-0${number}`,
        `Abstract physical model ${number}`,
        `Fyzický model projektu Abstract ${number}`,
      ))),
    ],
  },
  "mezi-vsim": {
    hero: media("mezi-vsim", "index", "Mezi vším installation", "Instalace Mezi vším"),
    sections: [
      section("installation", "model", "Installation", "Instalace", [1, 2, 3].map((number) => media(
        "mezi-vsim",
        `installation-0${number}`,
        `Mezi vším installation ${number}`,
        `Instalace Mezi vším ${number}`,
      ))),
      section("process", "graphic", "Process", "Proces", [1, 2, 3, 4, 5, 6].map((number) => media(
        "mezi-vsim",
        `process-0${number}`,
        `Mezi vším process ${number}`,
        `Proces projektu Mezi vším ${number}`,
      ))),
    ],
  },
  "polyporus-larixis": {
    hero: media("polyporus-larixis", "index", "Polyporus Larixis timber structure", "Dřevěná konstrukce Polyporus Larixis"),
    sections: [
      section("design", "model", "Design", "Návrh", [1, 2, 3, 4].map((number) => media(
        "polyporus-larixis",
        `design-0${number}`,
        `Polyporus Larixis design ${number}`,
        `Návrh Polyporus Larixis ${number}`,
      ))),
      section("realization", "graphic", "Realization", "Realizace", [1, 2, 3, 4, 5, 6].map((number) => media(
        "polyporus-larixis",
        `realization-0${number}`,
        `Polyporus Larixis realization ${number}`,
        `Realizace Polyporus Larixis ${number}`,
      ))),
    ],
  },
};

export function applyCuratedProjectMedia(projects) {
  return projects.map((project) => {
    const curated = CURATED_MEDIA[project.slug];
    if (!curated) {
      return project;
    }
    return {
      ...project,
      index: {
        ...project.index,
        image: curated.hero,
      },
      projectPage: {
        ...project.projectPage,
        hero: {
          ...project.projectPage?.hero,
          media: curated.hero,
        },
        featuredSections: curated.sections,
      },
    };
  });
}

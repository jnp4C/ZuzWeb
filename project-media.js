function media(slug, name, en, cs) {
  const base = `./assets/project-pages/${slug}/${name}`;
  return {
    src: `${base}-1800.webp`,
    srcset: `${base}-1100.webp 1100w, ${base}-1800.webp 1800w`,
    alt: { en, cs },
  };
}

function video(slug, name, posterName, en, cs) {
  return {
    type: "video",
    src: `./assets/project-pages/${slug}/${name}.mp4`,
    poster: `./assets/project-pages/${slug}/${posterName}-1800.webp`,
    alt: { en, cs },
  };
}

function section(id, kind, en, cs, items, options = {}) {
  return { id, kind, label: { en, cs }, media: items, ...options };
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
        media("cycle-of-change", "source-situation", "Cycle of Change situation", "Situace projektu Cyklus proměny"),
      ]),
      section("sections", "graphic", "Sections", "Řezy", [1, 2, 3].map((number) => media(
        "cycle-of-change",
        `source-section-0${number}`,
        `Cycle of Change section ${number}`,
        `Řez projektu Cyklus proměny ${number}`,
      ))),
      section("model", "model", "Model", "Model", [1, 2, 3, 4, 5, 6].map((number) => media(
        "cycle-of-change",
        `source-model-0${number}`,
        `Cycle of Change model ${number}`,
        `Model projektu Cyklus proměny ${number}`,
      ))),
      section("wider-relations", "graphic", "Wider relations", "Širší vztahy", [
        media("cycle-of-change", "source-wider-relations", "Wider landscape relations", "Širší krajinné vztahy"),
      ]),
      section("documentation", "graphic", "Documentation selection", "Výběr z dokumentace", [0, 1, 2, 3, 4].map((number) => media(
        "cycle-of-change",
        `source-documentation-0${number}`,
        `Cycle of Change documentation ${number + 1}`,
        `Dokumentace projektu Cyklus proměny ${number + 1}`,
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
      section("axonometry", "graphic", "Aerial axonometry", "Nadhledová axonometrie", [
        media("rewaterization", "source-axonometry", "Rewaterization aerial axonometry", "Nadhledová axonometrie Revodalizace"),
      ]),
      section("introduction", "graphic", "Introduction to the project", "Úvod do projektu", [1, 2].map((number) => media(
        "rewaterization",
        `source-introduction-0${number}`,
        `Rewaterization project introduction ${number}`,
        `Úvod do projektu Revodalizace ${number}`,
      ))),
      section("stream-revitalization", "graphic", "Stream revitalization scheme", "Schéma revitalizace toku", [
        media("rewaterization", "source-stream-revitalization", "Stream revitalization scheme", "Schéma revitalizace toku"),
      ]),
      section("model", "model", "Model", "Model", [1, 2, 3, 4, 5, 6].map((number) => media(
        "rewaterization",
        `source-model-0${number}`,
        `Rewaterization model ${number}`,
        `Model Revodalizace ${number}`,
      ))),
    ],
  },
  "steep-garden": {
    hero: media("steep-garden", "index", "Steep Garden visualization", "Vizualizace Zahrady ve svahu"),
    sections: [
      section("design-variant", "graphic", "One design variant", "Jedna z variant při navrhování", [
        media("steep-garden", "source-design-variant", "One Steep Garden design variant", "Jedna z variant Zahrady ve svahu"),
      ]),
      section("axonometry", "graphic", "Axonometry", "Axonometrie", [
        media("steep-garden", "source-axonometry", "Steep Garden axonometry", "Axonometrie Zahrady ve svahu"),
      ]),
      section("architectural-situation", "masterplan", "Architectural situation", "Architektonická situace", [
        media("steep-garden", "source-architectural-situation", "Steep Garden architectural situation", "Architektonická situace Zahrady ve svahu"),
      ]),
      section("documentation", "graphic", "Documentation examples", "Ukázky z dokumentace", [1, 2, 3, 4].map((number) => media(
        "steep-garden",
        `source-documentation-0${number}`,
        `Steep Garden documentation ${number}`,
        `Dokumentace Zahrady ve svahu ${number}`,
      ))),
      section("planting-plans", "masterplan", "Planting plans", "Osazovací plány", [1, 2].map((number) => media(
        "steep-garden",
        `source-planting-plan-0${number}`,
        `Steep Garden planting plan ${number}`,
        `Osazovací plán Zahrady ve svahu ${number}`,
      ))),
    ],
  },
  "growing-through": {
    hero: media("growing-through", "source-index", "Growing-Through installation visualization", "Vizualizace instalace Growing-Through"),
    sections: [
      section("visualization", "graphic", "Visualization", "Vizualizace", [
        media("growing-through", "source-visualization", "Growing-Through visualization", "Vizualizace Growing-Through"),
      ]),
      section("idea-concept", "graphic", "Idea concept", "Ideový koncept", [
        media("growing-through", "source-idea-concept", "Growing-Through idea concept", "Ideový koncept Growing-Through"),
      ]),
      section("situation", "masterplan", "Situation", "Situace", [
        media("growing-through", "source-situation", "Growing-Through situation", "Situace Growing-Through"),
      ]),
      section("construction-section", "graphic", "Construction section", "Řez konstrukcí", [
        media("growing-through", "source-section", "Growing-Through construction section", "Řez konstrukcí Growing-Through"),
      ]),
    ],
  },
  abstract: {
    hero: media("abstract", "source-index", "Abstract project perspective", "Perspektiva projektu Abstract"),
    sections: [
      section("masterplan", "masterplan", "Masterplan", "Masterplan", [
        media("abstract", "source-masterplan", "Abstract project masterplan", "Masterplan projektu Abstract"),
      ]),
      section("detail-plan", "masterplan", "Detail plan cutout", "Výřez detailního plánu", [
        media("abstract", "source-detail-plan", "Abstract project detail plan cutout", "Výřez detailního plánu projektu Abstract"),
      ]),
      section("block-axonometry", "graphic", "Axonometry of a block", "Axonometrie bloku", [
        media("abstract", "source-axonometry", "Abstract project block axonometry", "Axonometrie bloku projektu Abstract"),
      ]),
      section("perspectives", "graphic", "Perspectives", "Perspektivy", [1, 2, 3, 4, 5].map((number) => media(
        "abstract",
        `source-perspective-0${number}`,
        `Abstract project perspective ${number}`,
        `Perspektiva projektu Abstract ${number}`,
      ))),
    ],
  },
  "mezi-vsim": {
    hero: media("mezi-vsim", "source-index", "Mezi vším installation", "Instalace Mezi vším"),
    sections: [
      section("design", "graphic", "Design", "Návrh", [1, 2].map((number) => media(
        "mezi-vsim",
        `source-design-0${number}`,
        `Mezi vším design ${number}`,
        `Návrh Mezi vším ${number}`,
      ))),
      section("realization-process", "graphic", "Realization process", "Průběh realizace", [1, 2, 3].map((number) => media(
        "mezi-vsim",
        `source-realization-0${number}`,
        `Mezi vším realization process ${number}`,
        `Průběh realizace Mezi vším ${number}`,
      ))),
      section("exhibition", "graphic", "Exhibition", "Výstava", [1, 2, 3, 4, 5, 6, 7].map((number) => media(
        "mezi-vsim",
        `source-exhibition-0${number}`,
        `Mezi vším exhibition ${number}`,
        `Výstava Mezi vším ${number}`,
      ))),
      section("video-tour", "graphic", "Video tour", "Videoprohlídka", [
        video("mezi-vsim", "source-video-tour", "source-video-tour-poster", "Mezi vším video tour", "Videoprohlídka Mezi vším"),
      ]),
    ],
  },
  "tree-with-the-spirit-of-christmas": {
    hero: media("tree-with-the-spirit-of-christmas", "index", "Christmas tree project index visualization", "Indexová vizualizace vánočního stromu"),
    sections: [
      section("day-night-visualization", "graphic", "Day / night visualization", "Vizualizace den / noc", [
        media("tree-with-the-spirit-of-christmas", "day", "Christmas tree daytime visualization", "Vizualizace stromu ve dne"),
        media("tree-with-the-spirit-of-christmas", "night", "Christmas tree nighttime visualization", "Vizualizace stromu v noci"),
      ], { presentation: "day-night-fade" }),
    ],
  },
  "polyporus-larixis": {
    hero: media("polyporus-larixis", "index", "Polyporus Larixis timber structure", "Dřevěná konstrukce Polyporus Larixis"),
    sections: [
      section("concept", "graphic", "Polyporus Larixis concept", "Koncept „Polyporus Larixis“", [
        media("polyporus-larixis", "design-01", "Concept drawing for the Polyporus Larixis shelters", "Koncepční kresba přístřešků Polyporus Larixis"),
      ]),
      section("viewfinder", "graphic", "Path viewfinder", "Kukátko ukazující cestu", [
        media("polyporus-larixis", "design-02", "Design drawing of the path viewfinder", "Návrhová kresba kukátka ukazujícího cestu"),
      ]),
      section("bicycle-stand", "graphic", "Bicycle stand", "Stojan na kola", [
        media("polyporus-larixis", "design-03", "Design drawing of the bicycle stand", "Návrhová kresba stojanu na kola"),
      ]),
      section("roda-traden-realization", "realization", "Röda Tråden realization", "Realizace „Röda Tråden“", [1, 2, 3, 4].map((number) => media(
        "polyporus-larixis", `realization-0${number}`, `Röda Tråden construction process ${number}`, `Průběh realizace Röda Tråden ${number}`,
      ))),
      section("completed-structure", "realization", "Completed structure", "Dokončená stavba", [
        media("polyporus-larixis", "completed", "Completed Röda Tråden lakeside shelter", "Dokončený přístřešek Röda Tråden u jezera"),
      ]),
    ],
  },
  "new-landscape-of-high-speed-railways": {
    hero: media("new-landscape-of-high-speed-railways", "index", "New Landscape of High-Speed Railways", "Nová krajina vysokorychlostních tratí"),
    sections: [
      section("theoretical-conclusion", "graphic", "Conclusion of the theoretical part", "Závěr teoretické části", [
        media("new-landscape-of-high-speed-railways", "theory", "Summary diagram of the theoretical research", "Shrnující schéma teoretické části"),
      ]),
      section("analyses", "graphic", "Study-area analyses", "Ukázka analýz řešeného území", [1, 2, 3, 4].map((number) => media(
        "new-landscape-of-high-speed-railways", `analysis-0${number}`, `Study-area analysis ${number}`, `Analýza řešeného území ${number}`,
      ))),
      section("project-concept", "graphic", "Project concept", "Koncept projektu", [
        media("new-landscape-of-high-speed-railways", "concept", "Elbe Embroidery project concept", "Koncept projektu Polabská výšivka"),
      ]),
      section("masterplan", "masterplan", "Masterplan", "Masterplan", [1, 2, 3, 4].map((number) => media(
        "new-landscape-of-high-speed-railways", `masterplan-0${number}`, `High-speed railway landscape masterplan ${number}`, `Masterplan začlenění vysokorychlostní trati ${number}`,
      ))),
      section("atmospheric-collages", "graphic", "Atmospheric collages", "Atmosférické koláže", [1, 2, 3, 4, 5, 6].map((number) => media(
        "new-landscape-of-high-speed-railways", `collage-0${number}`, `Atmospheric collage ${number}`, `Atmosférická koláž ${number}`,
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

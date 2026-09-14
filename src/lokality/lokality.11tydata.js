export default {
  layout: "layouts/lokalita.njk",
  tags: ["lokality"],
  eleventyComputed: {
    description: (data) =>
      data.title
        ? `${data.title} – mobilní čištění vozidel i úklidové služby. Přijedeme až k vám, do 100 km od Prahy zdarma.`
        : data.description,
  },
};

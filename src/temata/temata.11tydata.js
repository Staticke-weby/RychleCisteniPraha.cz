export default {
  eleventyComputed: {
    title: (data) => (data.tema ? data.tema.label : "Témata"),
    description: (data) =>
      data.tema ? `${data.tema.description} Přehled souvisejících služeb a článků.` : "",
  },
};

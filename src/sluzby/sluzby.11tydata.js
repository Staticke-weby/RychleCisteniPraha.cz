export default {
  layout: "layouts/sluzba.njk",
  tags: ["sluzby"],
  eleventyComputed: {
    description: (data) =>
      data.excerpt ? `${data.excerpt} Mobilní čištění s dojezdem po celé Praze a okolí.` : data.description,
    ogImage: (data) => data.image || "hero",
  },
};

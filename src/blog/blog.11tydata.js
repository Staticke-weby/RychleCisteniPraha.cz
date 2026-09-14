export default {
  layout: "layouts/clanek.njk",
  tags: ["clanky"],
  eleventyComputed: {
    description: (data) => data.excerpt || data.description,
  },
};

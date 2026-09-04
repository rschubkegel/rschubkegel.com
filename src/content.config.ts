import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    tags: z.array(z.string()),
    author: z.string(),
  }),
})

const slides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/slides" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    tags: z.array(z.string()),
    author: z.string(),
    /**
     * If `true`, the slide will not be shown on the slides page.
     */
    hidden: z.boolean().optional(),
  }),
})

export const collections = {
  blog,
  slides,
}

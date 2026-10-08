

/**
 * @swagger
 * /blogs:
 *   get:
 *     summary: Get all published blogs
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service ID
 *     responses:
 *       200:
 *         description: Paginated list of published blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                         example: "How we built a scalable e-commerce platform"
 *                       slug:
 *                         type: string
 *                         example: "how-we-built-scalable-ecommerce"
 *                       shortDescription:
 *                         type: string
 *                       image:
 *                         type: string
 *                         example: "/uploads/blogs/1710-cover.jpg"
 *                       readTime:
 *                         type: number
 *                         example: 5
 *                       views:
 *                         type: number
 *                         example: 1240
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       author:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             slug:
 *                               type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /blogs/{slug}:
 *   get:
 *     summary: Get a blog by slug (with slug redirect support + auto view increment)
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog slug
 *         example: "how-we-built-scalable-ecommerce"
 *     responses:
 *       200:
 *         description: Blog detail or redirect signal if slug has changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 redirect:
 *                   type: boolean
 *                   description: true if slug has changed — frontend should redirect
 *                 newSlug:
 *                   type: string
 *                   description: new slug to redirect to (only when redirect is true)
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     shortDescription:
 *                       type: string
 *                     image:
 *                       type: string
 *                     readTime:
 *                       type: number
 *                     views:
 *                       type: number
 *                     publishedAt:
 *                       type: string
 *                       format: date-time
 *                     author:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         image:
 *                           type: string
 *                         tagline:
 *                           type: string
 *                         linkedin:
 *                           type: string
 *                         twitter:
 *                           type: string
 *                     contentBlocks:
 *                       type: array
 *                       description: Ordered array of content blocks — render sequentially
 *                       items:
 *                         type: object
 *                         properties:
 *                           blockId:
 *                             type: string
 *                             description: Stable client-generated UUID
 *                           type:
 *                             type: string
 *                             enum: [editor, gallery, youtube, quote]
 *                             example: "editor"
 *                           label:
 *                             type: string
 *                             description: Section heading (editor + quote blocks)
 *                           html:
 *                             type: string
 *                             description: Rich HTML content (editor + quote blocks)
 *                           youtubeUrl:
 *                             type: string
 *                             description: YouTube URL (youtube blocks only)
 *                           images:
 *                             type: array
 *                             description: Gallery images (gallery blocks only)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 image:
 *                                   type: string
 *                                   example: "/uploads/blogs/xyz.jpg"
 *                                 caption:
 *                                   type: string
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           slug:
 *                             type: string
 *                     relatedCaseStudies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           bannerImage:
 *                             type: string
 *                           shortDescription:
 *                             type: string
 *                     faqs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question:
 *                             type: string
 *                           answer:
 *                             type: string
 *                     meta:
 *                       type: object
 *                       properties:
 *                         meta_title:
 *                           type: string
 *                         meta_description:
 *                           type: string
 *                         meta_keywords:
 *                           type: array
 *                           items:
 *                             type: string
 *                         og_title:
 *                           type: string
 *                         og_description:
 *                           type: string
 *                         og_image:
 *                           type: string
 *                         twitter_title:
 *                           type: string
 *                         twitter_description:
 *                           type: string
 *                         twitter_image:
 *                           type: string
 *                         canonical_url:
 *                           type: string
 *                         allow_indexing:
 *                           type: boolean
 *                         schema_markup:
 *                           type: string
 *       404:
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /blogs/{slug}/related:
 *   get:
 *     summary: Get related blogs (same service tags)
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog slug to find related posts for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Number of related blogs to return
 *     responses:
 *       200:
 *         description: List of related blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       shortDescription:
 *                         type: string
 *                       image:
 *                         type: string
 *                       readTime:
 *                         type: number
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       author:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             slug:
 *                               type: string
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /blogs/author/{authorId}:
 *   get:
 *     summary: Get all published blogs by a specific author
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: authorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The author document ID
 *         example: "664f1a2b3c4d5e6f7a8b9c0d"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Paginated list of published blogs by the author
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       shortDescription:
 *                         type: string
 *                       image:
 *                         type: string
 *                       readTime:
 *                         type: number
 *                       views:
 *                         type: number
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       author:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                           tagline:
 *                             type: string
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             slug:
 *                               type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
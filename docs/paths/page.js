
/**
 * @swagger
 * /pages/{slug}:
 *   get:
 *     summary: Get a page by slug (with slug redirect support)
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The page slug
 *         example: "privacy-policy"
 *     responses:
 *       200:
 *         description: Page detail or redirect signal if slug has changed
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
 *                       example: "Privacy Policy"
 *                     slug:
 *                       type: string
 *                       example: "privacy-policy"
 *                     shortDescription:
 *                       type: string
 *                     description:
 *                       type: string
 *                       description: Full HTML content of the page
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
 *         description: Page not found
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


/**
 * @swagger
 * /case-studies:
 *   get:
 *     summary: Get all active case studies
 *     tags: [CaseStudies]
 *     parameters:
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured case studies only
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry ID
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service ID
 *       - in: query
 *         name: solution
 *         schema:
 *           type: string
 *         description: Filter by solution ID  
 *       - in: query
 *         name: technology
 *         schema:
 *           type: string
 *         description: Filter by technology ID
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
 *         description: Paginated list of active case studies
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
 *                         example: "Product Catalogue for Alutech"
 *                       slug:
 *                         type: string
 *                         example: "product-catalogue-alutech"
 *                       shortDescription:
 *                         type: string
 *                       bannerImage:
 *                         type: string
 *                       logo:
 *                         type: string
 *                       featured:
 *                         type: boolean
 *                       displayOrder:
 *                         type: number
 *                       industry:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             slug:
 *                               type: string
 *                             icon:
 *                               type: string
 *                       technologies:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             slug:
 *                               type: string
 *                             logo:
 *                               type: string
 *                       statistics:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                               example: "Customer satisfaction rate"
 *                             value:
 *                               type: string
 *                               example: "95%"
 *                             isFeatured:
 *                               type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
 * /case-studies/featured:
 *   get:
 *     summary: Get featured case studies (for homepage section)
 *     tags: [CaseStudies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Maximum number of featured case studies to return
 *     responses:
 *       200:
 *         description: List of featured case studies
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
 *                       bannerImage:
 *                         type: string
 *                       logo:
 *                         type: string
 *                       featured:
 *                         type: boolean
 *                       displayOrder:
 *                         type: number
 *                       industry:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             slug:
 *                               type: string
 *                       statistics:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             value:
 *                               type: string
 *                             isFeatured:
 *                               type: boolean
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
 * /case-studies/filters:
 *   get:
 *     summary: Get available filter options (industries, services, technologies, solutions used in active case studies)
 *     tags: [CaseStudies]
 *     responses:
 *       200:
 *         description: Filter options for listing page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     industries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
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
 *                     technologies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                     solutions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
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
 * /case-studies/{slug}:
 *   get:
 *     summary: Get a case study by slug
 *     tags: [CaseStudies]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The case study slug
 *         example: "product-catalogue-alutech"
 *     responses:
 *       200:
 *         description: Case study found or redirect signal if slug has changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 redirect:
 *                   type: boolean
 *                   description: true if the slug has changed — frontend should redirect
 *                 newSlug:
 *                   type: string
 *                   example: "new-product-catalogue-alutech"
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
 *                     clientName:
 *                       type: string
 *                     clientCompany:
 *                       type: string
 *                     clientDesignation:
 *                       type: string
 *                     industry:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         slug:
 *                           type: string
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           icon:
 *                             type: string
 *                     technologies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           logo:
 *                             type: string
 *                           description:
 *                             type: string
 *                     solutions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                     timeline:
 *                       type: string
 *                       example: "6 months"
 *                     websiteUrl:
 *                       type: string
 *                     bannerImage:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     gallery:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           image:
 *                             type: string
 *                             example: "/uploads/casestudies/gallery/1710-homepage.jpg"
 *                           label:
 *                             type: string
 *                             example: "01 HOMEPAGE — DESKTOP"
 *                     overview:
 *                       type: string
 *                     challenge:
 *                       type: string
 *                     proposedSolution:
 *                       type: string
 *                     implementation:
 *                       type: string
 *                     outcome:
 *                       type: string
 *                     statistics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           value:
 *                             type: string
 *                           isFeatured:
 *                             type: boolean
 *                     testimonial:
 *                       type: object
 *                       properties:
 *                         clientName:
 *                           type: string
 *                         company:
 *                           type: string
 *                         designation:
 *                           type: string
 *                         quote:
 *                           type: string
 *                         video:
 *                           type: string
 *                         thumbnail:
 *                           type: string
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
 *                     meta:
 *                       type: object
 *                       properties:
 *                         meta_title:
 *                           type: string
 *                         meta_description:
 *                           type: string
 *                         og_image:
 *                           type: string
 *                         twitter_image:
 *                           type: string
 *                         canonical_url:
 *                           type: string
 *                         allow_indexing:
 *                           type: boolean
 *       404:
 *         description: Case study not found
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
 * /case-studies/{slug}/adjacent:
 *   get:
 *     summary: Get previous and next case study for navigation arrows
 *     tags: [CaseStudies]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The current case study slug
 *         example: "emc-hospital"
 *     responses:
 *       200:
 *         description: Previous and next case study
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     prev:
 *                       nullable: true
 *                       type: object
 *                       description: Previous case study (null if first)
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                           example: "GMP Manufacturing"
 *                         slug:
 *                           type: string
 *                           example: "gmp-manufacturing"
 *                         bannerImage:
 *                           type: string
 *                           example: "https://mernappadmin.phitanydev.in/uploads/casestudies/1710-banner.jpg"
 *                     next:
 *                       nullable: true
 *                       type: object
 *                       description: Next case study (null if last)
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                           example: "EMC Hospital"
 *                         slug:
 *                           type: string
 *                           example: "emc-hospital"
 *                         bannerImage:
 *                           type: string
 *                           example: "https://mernappadmin.phitanydev.in/uploads/casestudies/1710-banner.jpg"
 *       404:
 *         description: Case study not found
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
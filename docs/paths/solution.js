

/**
 * @swagger
 * /solutions:
 *   get:
 *     summary: Get all active solutions
 *     tags: [Solutions]
 *     responses:
 *       200:
 *         description: List of active solutions sorted by display order
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
 *                         example: "664f1a2b3c4d5e6f7a8b9c0d"
 *                       name:
 *                         type: string
 *                         example: "E-Commerce Solutions"
 *                       shortDescription:
 *                         type: string
 *                         example: "End-to-end e-commerce platforms built for scale."
 *                       image:
 *                         type: string
 *                         example: "https://mernappadmin.phitanydev.in/uploads/solutions/1710-ecommerce.jpg"
 *                       keyPoints:
 *                         type: array
 *                         description: Bullet points with icon + text
 *                         items:
 *                           type: object
 *                           properties:
 *                             icon:
 *                               type: string
 *                               example: "https://mernappadmin.phitanydev.in/uploads/solutions/icons/1710-cart.svg"
 *                             text:
 *                               type: string
 *                               example: "Custom product catalogue with advanced filtering"
 *                       relatedCaseStudies:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                               example: "Product Catalogue for Alutech"
 *                             slug:
 *                               type: string
 *                               example: "product-catalogue-alutech"
 *                             bannerImage:
 *                               type: string
 *                               example: "https://mernappadmin.phitanydev.in/uploads/casestudies/1710-banner.jpg"
 *                             shortDescription:
 *                               type: string
 *                       displayOrder:
 *                         type: number
 *                         example: 1
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
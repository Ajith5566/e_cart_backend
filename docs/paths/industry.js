
/**
 * @swagger
 * /industries:
 *   get:
 *     summary: Get all active industries
 *     tags: [Industries]
 *     responses:
 *       200:
 *         description: List of active industries
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
 *                         example: "Healthcare"
 *                       slug:
 *                         type: string
 *                         example: "healthcare"
 *                       description:
 *                         type: string
 *                         example: "Digital solutions for the healthcare sector."
 *                       image:
 *                         type: string
 *                         example: "https://mernappadmin.phitanydev.in/uploads/industries/1710-healthcare.jpg"
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

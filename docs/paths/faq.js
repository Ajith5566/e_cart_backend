
/**
 * @swagger
 * /faqs:
 *   get:
 *     summary: Get all active FAQs
 *     tags: [faq]
 *     responses:
 *       200:
 *         description: List of active FAQs
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
 *                       question:
 *                         type: string
 *                         example: "What services do you offer?"
 *                       answer:
 *                         type: string
 *                         example: "We offer web design and development."
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
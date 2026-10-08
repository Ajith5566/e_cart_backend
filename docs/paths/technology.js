
/**
 * @swagger
 * /technologies:
 *   get:
 *     summary: Get all active technologies
 *     tags: [Technologies]
 *     responses:
 *       200:
 *         description: List of active technologies sorted by display order
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
 *                         example: "React.js"
 *                       slug:
 *                         type: string
 *                         example: "react-js"
 *                       logo:
 *                         type: string
 *                         example: "/uploads/technologies/1710-react.svg"
 *                       description:
 *                         type: string
 *                         example: "A JavaScript library for building user interfaces."
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

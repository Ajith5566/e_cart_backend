

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Get all active clients
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: List of active clients with logo
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
 *                         example: "Alutech Industries"
 *                       logo:
 *                         type: string
 *                         example: "/uploads/clients/1710-alutech.png"
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
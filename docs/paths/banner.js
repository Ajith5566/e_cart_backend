
/**
 * @swagger
 * /banners:
 *   get:
 *     summary: Get all active banners sorted by display order
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of active banners
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
 *                       title:
 *                         type: string
 *                         example: "Welcome to Phitany"
 *                       sub_title:
 *                         type: string
 *                         example: "We build digital products that matter"
 *                       button_text:
 *                         type: string
 *                         example: "Get Started"
 *                       url:
 *                         type: string
 *                         example: "/contact"
 *                       banner_image:
 *                         type: string
 *                         example: "/uploads/banners/1710-desktop.jpg"
 *                       mobile_image:
 *                         type: string
 *                         example: "/uploads/banners/1710-mobile.jpg"
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
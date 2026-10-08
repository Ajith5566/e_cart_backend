
/**
 * @swagger
 * /testimonials:
 *   get:
 *     summary: Get all active testimonials
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, video]
 *         description: Filter by testimonial type — omit to get both
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service ID
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry ID
 *     responses:
 *       200:
 *         description: List of active testimonials
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
 *                       type:
 *                         type: string
 *                         enum: [text, video]
 *                         example: "text"
 *                       name:
 *                         type: string
 *                         example: "John Smith"
 *                       designation:
 *                         type: string
 *                         example: "CEO"
 *                       company:
 *                         type: string
 *                         example: "Alutech Industries"
 *                       image:
 *                         type: string
 *                         example: "/uploads/testimonials/1710-john.jpg"
 *                       message:
 *                         type: string
 *                         description: Text testimonial message (type=text only)
 *                         example: "Working with Phitany was a great experience..."
 *                       url:
 *                         type: string
 *                         description: External link (type=text only)
 *                       videoUrl:
 *                         type: string
 *                         description: YouTube or Vimeo URL (type=video only)
 *                         example: "https://www.youtube.com/watch?v=abc123"
 *                       quote:
 *                         type: string
 *                         description: Short quote shown alongside video (type=video only)
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                               example: "Digital Engineering"
 *                             slug:
 *                               type: string
 *                               example: "digital-engineering"
 *                       industry:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                             example: "Healthcare"
 *                           slug:
 *                             type: string
 *                             example: "healthcare"
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

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a contact enquiry
 *     tags: [Contact-us]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "+91 98765 43210"
 *               message:
 *                 type: string
 *                 example: "I would like to discuss a project..."
 *     responses:
 *       201:
 *         description: Enquiry submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Thank you for reaching out. We will get back to you soon."
 *       400:
 *         description: Validation error — missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Message is required"
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
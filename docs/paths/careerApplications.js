
/**
 * @swagger
 * /careers/apply:
 *   post:
 *     summary: Submit a job application with CV
 *     tags: [CareersApplications]
 *     description: >
 *       Submits a job application. CV must be uploaded as a file (PDF, DOC, DOCX).
 *       Duplicate applications (same email + same jobTitle) are rejected with 409.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - jobTitle
 *               - cv
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
 *               jobTitle:
 *                 type: string
 *                 example: "Senior React Developer"
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: CV file — PDF, DOC, or DOCX
 *     responses:
 *       201:
 *         description: Application submitted successfully
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
 *                   example: "Application submitted successfully. We will get back to you soon."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     jobTitle:
 *                       type: string
 *       400:
 *         description: Validation error — missing required fields or CV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "CV is required"
 *       409:
 *         description: Duplicate application — already applied for this position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You have already applied for this position"
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
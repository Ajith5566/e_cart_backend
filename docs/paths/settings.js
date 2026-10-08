
/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get site settings (contact info, social links, counters)
 *     tags: [Settings]
 *     description: >
 *       Returns the global site settings used across the frontend —
 *       contact details, social media links, and the four homepage
 *       counter values (years of experience, projects completed, etc.)
 *     responses:
 *       200:
 *         description: Site settings
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
 *                     email:
 *                       type: string
 *                       example: "hello@phitany.com"
 *                     phone:
 *                       type: string
 *                       example: "+91 98765 43210"
 *                     address:
 *                       type: string
 *                       example: "Kochi, Kerala, India"
 *                     facebook:
 *                       type: string
 *                       example: "https://facebook.com/phitany"
 *                     twitter:
 *                       type: string
 *                       example: "https://twitter.com/phitany"
 *                     linkedin:
 *                       type: string
 *                       example: "https://linkedin.com/company/phitany"
 *                     instagram:
 *                       type: string
 *                       example: "https://instagram.com/phitany"
 *                     youtube:
 *                       type: string
 *                       example: "https://youtube.com/@phitany"
 *                     yearsOfExperience:
 *                       type: string
 *                       example: "14+"
 *                     projectsCompleted:
 *                       type: string
 *                       example: "460+"
 *                     clientSatisfaction:
 *                       type: string
 *                       example: "95%"
 *                     expertTeamMembers:
 *                       type: string
 *                       example: "50+"
 *       404:
 *         description: Settings not configured
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
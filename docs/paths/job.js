

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all active job listings
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Full time, Part time, Contract, Internship, Remote]
 *         description: Filter by job type — omit to get all
 *     responses:
 *       200:
 *         description: List of active jobs
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
 *                         example: "Senior React Developer"
 *                       skills:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["React js", "Node js", "Tailwind"]
 *                       experience:
 *                         type: string
 *                         example: "3+ years"
 *                       jobType:
 *                         type: string
 *                         enum: [Full time, Part time, Contract, Internship, Remote]
 *                         example: "Full time"
 *                       location:
 *                         type: string
 *                         example: "Kochi, Kerala"
 *                       description:
 *                         type: string
 *                         description: Full HTML job description
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Use as "Posted on" date
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

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get a single job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job document ID
 *     responses:
 *       200:
 *         description: Job detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                       example: "Senior React Developer"
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["React js", "Node js", "Tailwind"]
 *                     experience:
 *                       type: string
 *                       example: "3+ years"
 *                     jobType:
 *                       type: string
 *                       enum: [Full time, Part time, Contract, Internship, Remote]
 *                     location:
 *                       type: string
 *                     description:
 *                       type: string
 *                       description: Full HTML job description
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Job not found
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
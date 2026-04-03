export const MOCK_COURSES = [
  // {
  //   _id: 'mock-1',
  //   title: 'Complete React Development',
  //   description:
  //     'Master React hooks, context, Redux and real-world projects from zero to hero.',
  //   price: 2999,
  //   courseType: 'recorded',
  //   thumbnail: 'https://picsum.photos/seed/react/600/400',
  //   videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  // },
  // {
  //   _id: 'mock-2',
  //   title: 'Node.js & Express Masterclass',
  //   description:
  //     'Build scalable REST APIs with Node.js, Express, and MongoDB. Deploy to cloud.',
  //   price: 3499,
  //   courseType: 'live',
  //   thumbnail: 'https://picsum.photos/seed/node/600/400',
  //   liveClassLink: 'https://meet.google.com/demo',
  // },
  // {
  //   _id: 'mock-3',
  //   title: 'Full Stack Web Development',
  //   description:
  //     'Complete bootcamp — HTML, CSS, JS, React, Node, MongoDB — all in one course.',
  //   price: 4999,
  //   courseType: 'recorded',
  //   thumbnail: 'https://picsum.photos/seed/fullstack/600/400',
  //   videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  // },
  // {
  //   _id: 'mock-4',
  //   title: 'Python for Data Science',
  //   description:
  //     'Pandas, NumPy, Matplotlib and machine learning with hands-on projects.',
  //   price: 3999,
  //   courseType: 'live',
  //   thumbnail: 'https://picsum.photos/seed/python/600/400',
  //   liveClassLink: 'https://meet.google.com/demo',
  // },
  // {
  //   _id: 'mock-5',
  //   title: 'UI/UX Design Fundamentals',
  //   description:
  //     'Design thinking, Figma, wireframing, prototyping and user research techniques.',
  //   price: 1999,
  //   courseType: 'recorded',
  //   thumbnail: 'https://picsum.photos/seed/design/600/400',
  //   videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  // },
  // {
  //   _id: 'mock-6',
  //   title: 'DevOps: Docker & Kubernetes',
  //   description:
  //     'CI/CD pipelines, container orchestration and cloud deployments from scratch.',
  //   price: 5499,
  //   courseType: 'live',
  //   thumbnail: 'https://picsum.photos/seed/devops/600/400',
  //   liveClassLink: 'https://meet.google.com/demo',
  // },
];

export const MOCK_ASSIGNMENTS = [
  {
    _id: "a1",
    title: "Build a REST API",
    description:
      "Create a full CRUD REST API with auth, validation, and error handling using Express.",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    courseId: "mock-1",
    courseTitle: "Complete React Development",
  },
  {
    _id: "a2",
    title: "React Component Library",
    description:
      "Build 5 reusable, well-documented React components with props and state.",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    courseId: "mock-2",
    courseTitle: "Node.js & Express Masterclass",
  },
  {
    _id: "a3",
    title: "Database Schema Design",
    description:
      "Design a MongoDB schema for an e-commerce platform with proper relationships.",
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    courseId: "mock-3",
    courseTitle: "Full Stack Web Development",
  },
];

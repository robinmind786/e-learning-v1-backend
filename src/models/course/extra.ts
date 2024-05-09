const courseData = {
  courseDetails: {
    title: "Your Course Title",
    thumbnail: {
      public_id: "your_public_id",
      url: "your_thumbnail_url",
    },
    shortDescription: "Your course short description",
    description: "Your course description",
    price: 100,
    disPrice: 80,
    duration: 10,
    category: ["Category1", "Category2"],
    level: "Intermediate",
    language: "English",
    featured: true,
    videoLength: "1 hour",
    totalLecture: 10,
    purchased: 0,
    tags: ["Tag1", "Tag2"],
    benefits: [
      { title: "Benefit1", description: "Description1" },
      { title: "Benefit2", description: "Description2" },
    ],
    prerequisites: [
      { title: "Prerequisite1", description: "Description1" },
      { title: "Prerequisite2", description: "Description2" },
    ],
  },
  review: [
    {
      user: "user_id_1",
      rating: 4,
      comment: "Great course, highly recommended!",
    },
  ],
  comment: [
    {
      user: "user_id_2",
      question: "I have a question...",
      questionReplies: [
        { user: "user_id_1", answer: "Here's the answer to your question." },
      ],
    },
  ],
  lecture: [
    {
      videoUrl: [
        {
          title: "Introduction to the Course",
          description: "An overview of what you'll learn in this course.",
          url: "https://www.example.com/introduction",
          links: [
            { title: "Course Website", url: "https://www.example.com/course" },
          ],
        },
        {
          title: "Module 1: Getting Started",
          description: "Learn the basics to get started with the course.",
          url: "https://www.example.com/module1",
          links: [
            {
              title: "Module Materials",
              url: "https://www.example.com/module1/materials",
            },
          ],
        },
      ],
      videoSection: "Module 1",
      suggestions:
        "Feel free to ask questions if you need further clarification.",
    },
    {
      videoUrl: [
        {
          title: "Module 2: Advanced Techniques",
          description: "Explore advanced techniques in this module.",
          url: "https://www.example.com/module2",
          links: [
            {
              title: "Advanced Resources",
              url: "https://www.example.com/module2/resources",
            },
          ],
        },
      ],
      videoSection: "Module 2",
      suggestions: "Practice regularly to master the advanced concepts.",
    },
  ],

  instructor: "instructor_id",
  users: ["user_id_1", "user_id_2", "user_id_3"],
};

// Now you can use this 'courseData' object to create a new course entry in your database.

// general varibales

var responsive = {
    superLargeDesktop: {
        // the naming can be any, depends on you.
        breakpoint: {max: 4000, min: 3000},
        items: 6
    },
    desktop: {
        breakpoint: {max: 3000, min: 1024},
        items: 5
    },
    tablet: {
        breakpoint: {max: 1024, min: 464},
        items: 2
    },
    mobile: {
        breakpoint: {max: 464, min: 0},
        items: 1
    }
};
var stockImage = [
    { os: 'Windows', os_types: 'Windows 10',
      os_image: require("../../../assets/images/OS_logo/windows_logo.png"),
    image_arn: [
      {
        name: 'Microsoft Windows 10', yaml: 'windows10_fresh.yaml'
      },
      {
        name: 'Microsoft Windows Server 2019', yaml: 'test.yaml'
      }
    ]},
    { os: 'Linux', os_types: 'Ubuntu, Debian and Kali Linux',
      os_image: require("../../../assets/images/OS_logo/linux_logo.png"),
    image_arn: [
      {
        name: 'Ubuntu', yaml: 'ubuntu_fresh.yaml'
      },
      {
        name: 'Debian', yaml: 'debian_fresh.yaml'
      },
      {
        name: 'CentOS', yaml: 'centos_fresh.yaml'
      },
      {
        name: 'Kali Linux', yaml: 'kali_fresh.yaml'
      }
    ]},

];

var userIcons = [
  {role: 'student', icon: 'OmniLab02'},
  {role: 'instructor', icon: 'OmniLab03'},
  {role: 'customer_admin', icon: 'OmniLab04'},
  {role: 'biz_customer_admin', icon: 'OmniLab04'},
  {role: 'biz_default_user', icon: 'OmniLab04'},
  {role: 'admin', icon: 'OmniLab05'}
]

// var secret = '3aEO40WqC4iipPtNxIG5WIHVHCDHUlzXkdtJCA6SM'; -- bbb.omnifsi
var secret = '1vwDxtjIjXSRrTol0PFQcAekVhwcLJboor3VlrJDBhE';

var weekDays = [
  {name: "Sun", id: 0},
  {name: "Mon", id: 1},
  {name: "Tue", id: 2},
  {name: "Wed", id: 3},
  {name: "Thu", id: 4},
  {name: "Fri", id: 5},
  {name: "Sat", id: 6}
]

var repeatEvents = [
  { name: 'daily', types: [
    {name: 'Every Day', value: '1'},
    // {name: 'Every 2 Days', value: '2'},
    // {name: 'Every 3 Days', value: '3'},
    // {name: 'Every 4 Days', value: '4'},
    // {name: 'Every 5 Days', value: '5'},
    // {name: 'Every 6 Days', value: '6'}
  ]},
  { name: 'weekly', types: [
    {name: 'Every Week', value: '1'},
    // {name: 'Every 2 Weeks', value: '2'},
    // {name: 'Every 3 Weeks', value: '3'},
    // {name: 'Every 4 Weeks', value: '4'},
    // {name: 'Every 5 Weeks', value: '5'},
    // {name: 'Every 6 Weeks', value: '6'}
  ]},
  { name: 'monthly', types: [
    {name: 'Every Month', value: '1'},
    // {name: 'Every 2 Months'},
    // {name: 'Every 3 Months'},
    // {name: 'Every 4 Months'},
    // {name: 'Every 5 Months'},
    // {name: 'Every 6 Months'}
  ]},
]

// The backend Python API for resource management
// The stage name. Used in the backend Python API for resource mgmt
// The React API Gateway URL
var stgName, reactAPIURL, s3BucketUrl, backendAPIURL, url, socketUrl;

const hostParts = window.location.host.split(".");
let subdomain = hostParts[0];

// Check if the first part is "www" and if there are more parts
if (hostParts[0] === "www") {
  subdomain = hostParts[1];
}
console.log(subdomain);
if(subdomain === 'dev'){
  stgName = 'dev'
  reactAPIURL = 'https://react-api.omnifsi.com/dev/'
  s3BucketUrl = 'https://invoclass-storage.s3.amazonaws.com/';
  backendAPIURL = 'https://api.omnifsi.com/';
  url = 'https://dev.portal.omnifsi.com';
  socketUrl = 'wss://f0fy0gjoj2.execute-api.us-east-1.amazonaws.com/dev'
} else if (subdomain === 'demo') {
  stgName = 'prod'
  reactAPIURL = 'https://dv66x4kos0.execute-api.us-east-1.amazonaws.com/prod/'
  s3BucketUrl = 'https://omnifsi-s3uploads-demo.s3.amazonaws.com/';
  backendAPIURL = 'https://eb.demo.omnifsi.com/';
  url = 'https://demo.omnifsi.com'
  // socketUrl = 'wss://f0fy0gjoj2.execute-api.us-east-1.amazonaws.com/dev'
} if(subdomain === 'portal') {
  // Put this in place for the portal.omnifsi.com site in the DEV AWS acct
  stgName = 'dev'
  reactAPIURL = 'https://react-api.omnifsi.com/dev/'
  s3BucketUrl = 'https://invoclass-storage.s3.amazonaws.com/';
  backendAPIURL = 'https://api.omnifsi.com/';
  url = 'https://portal.invoclass.com';
  socketUrl = 'wss://f0fy0gjoj2.execute-api.us-east-1.amazonaws.com/dev'
} else {
  //update this section when your working in your localhost {localhost:3000}
  //uncomment the below lines if you are working with DEV env
  stgName = 'dev'
  reactAPIURL = 'https://react-api.omnifsi.com/dev/'
  s3BucketUrl = 'https://invoclass-storage.s3.amazonaws.com/';
  backendAPIURL = 'https://api.omnifsi.com/'
  url = 'http://localhost:3000'
  socketUrl = 'wss://f0fy0gjoj2.execute-api.us-east-1.amazonaws.com/dev'
  //uncomment the below lines if you are working with PROD/demo env
  // stgName = 'prod'
  // reactAPIURL = 'https://dv66x4kos0.execute-api.us-east-1.amazonaws.com/prod/'
  // s3BucketUrl = 'https://omnifsi-s3uploads-demo.s3.amazonaws.com/';
  // backendAPIURL = 'https://eb.demo.omnifsi.com/'
}

var sampleFile = 'https://omnilab-s3uploads.s3.amazonaws.com/brixon/sample_file/sample_file_format.csv';

const videoConferenceInfo = 'The days of the week that can be selected under video conferencing specifies which days in the week the class section will be held. If left unchecked the default values are all the week days between start and end date of the class'
const root = {
  width: '18rem',
  margin: 10,
  height: '250px'
}
const media = {
  height: 80
}

const card_media = {
    minWidth: 230,
    minHeight: 230,
    backgroundColor: 'rgba(13, 50, 82, 0.9)',
    borderRadius: 15
}
const card_media_pointer = {
    minWidth: 230,
    minHeight: 230,
    backgroundColor: 'rgba(13, 50, 82, 0.9)',
    borderRadius: 15,
    cursor: 'pointer'
}
const templateSteps = [
  'Lab Template Information',
  'Lab Template Selection and Design',
  'Review and Submit'
];

const templateEditorText = {
  'Step one': `Add network segments.  These are containers that define network boundaries.  Virtual Assets inside Public Segments are network-accessible to each other and each can reach the public Internet.  Virtual Assets inside Private Segments are network-accessible to each other and can not reach not the public Internet.  They can route to the Bridge Segment but are not considered on the same LAN for ethernet broadcast purposes. Virtual Assets inside Bridge Segments are network-accessible to each other and cannot reach the public Internet.  They can respond to traffic originating from Virtual Assets in Private Segments.  They can route traffic to Virtual Assets in Public Segments.`,
  'Step two': `Once you’ve defined your segments, you can add Virtual Assets to those segments.  Drag and Drop from the left menu.  Eligible options include your own Stand Alone templates, stock images supplied by InvoClass, and any Customized Stock Images you uploaded to the library.`,
  'Step three': `Save`
}

const classSteps = [
  {
    label: 'Overview',
    isCompleted: false,
  },
  {
    label: 'Load & Schedule',
    isCompleted: false,
  },
  {
    label: 'Price',
    isCompleted: false,
  },
  {
    label: 'Content',
    isCompleted: false,
  },
  {
    label: 'Review and Submit',
    isCompleted: false,
  },
];

const studentSteps = [
  {
    label: 'Overview',
    isCompleted: false,
  }
];

const templateTypes = [
  {
    name: 'Stand Alone', type: 'stand_alone',
    description: 'Stand Alone templates provide each learner with the same copy of their own single virtual computer.  These templates count against only one of your account’s Virtual Asset Count, regardless of the number of learners you have in classes utilizing this template.',
    includes: [
      {
        name: 'Stock Images(market place)', value: 'windows and linux'
      },
      {
        name: 'Use an existing stand alone template', value: 'you can pick'
      },
      {
        name: 'Upload your custom image(will take the user to new window to do the process)', value: `Your image won't be available
        right away to create templates using it. The uploaded image needs to be converted to meet our standards before making it available. Time frame here. `
      }
    ]
  },
  { name: 'Network', type: 'network',
    description: 'Network templates provide you with the ability to create complex lab environments complete with workstation and server components.  During configuration you can determine if these virtual machines are Internet-connected, and/or network-accessible by other machines in your lab.  Each virtual machine created under this template counts against one of your account’s Virtual Asset Count.',
    includes: [
      {
        name: 'Stock Images(market place)', value: 'windows and linux'
      },
      {
        name: 'Use existing stand alone templates', value: 'you can pick'
      }
    ]
  },
];

const templateSizes = [
  'Small', 'Medium', 'Large'
];

const enrollURL = 'https://enroll.portal.invoclass.com/home';

const templateTiers = [
  {
    name: 'Starter',
    desc: `20 machines cap.`,
    price: 50,
    conversion: true,
    support: true,
    id: 20,
    type: 'individual'
  },
  {
    name: 'Pro',
    desc: `200 machines cap.`,
    price: 5500,
    conversion: true,
    support: true,
    id: 200,
    type: 'enterprise'
  }
]

const classCategories = [
  "Development",
  "Programming Languages",
  "Web Development",
  "Mobile App Development",
  "Game Development",
  "Software Engineering",
  "Data Science",
  "Machine Learning",
  "Artificial Intelligence",
  "Deep Learning",
  "Computer Vision",
  "Natural Language Processing",
  "Data Analysis",
  "Big Data",
  "Database Design & Development",
  "Cybersecurity",
  "Ethical Hacking",
  "Cryptocurrency & Blockchain",
  "Cloud Computing",
  "DevOps",
  "IT Certification",
  "Network & Security",
  "Operating Systems",
  "IT Fundamentals",
  "Business",
  "Entrepreneurship",
  "Business Strategy",
  "Marketing",
  "Digital Marketing",
  "Social Media Marketing",
  "SEO (Search Engine Optimization)",
  "Content Marketing",
  "Email Marketing",
  "Sales",
  "Project Management",
  "Finance",
  "Accounting",
  "Investing & Trading",
  "Personal Finance",
  "Leadership",
  "Management",
  "Human Resources",
  "Communication Skills",
  "Presentation Skills",
  "Public Speaking",
  "Negotiation Skills",
  "Writing",
  "Creative Writing",
  "Copywriting",
  "Blogging",
  "Graphic Design",
  "UI/UX Design",
  "Photoshop",
  "Illustrator",
  "Video Editing",
  "Music",
  "Guitar",
  "Piano",
  "Singing",
  "Music Production",
  "Art",
  "Drawing",
  "Painting",
  "Sculpting",
  "Crafts",
  "Personal Development",
  "Mindfulness",
  "Meditation",
  "Life Coaching",
  "Personal Transformation",
  "Health & Fitness",
  "Nutrition",
  "Yoga",
  "Fitness Training",
  "Weight Loss",
  "Cooking",
  "Baking",
  "Home Improvement",
  "DIY",
  "Interior Design",
  "Gardening",
  "Parenting",
  "Pregnancy & Childbirth",
  "Child Psychology",
  "Language Learning",
  "English Language",
  "Spanish Language",
  "French Language",
  "German Language",
  "Chinese Language",
  "Japanese Language",
  "Arabic Language",
  "Travel",
  "Photography",
  "Fashion",
  "Beauty",
  "Wedding Planning",
  "Pet Care & Training",
  "Sustainability & Green Living",
  "Windows",
  "Windows Server",
  "Linux",
  "Kali",
  "Ubuntu",
  "Debian",
  "CentOS",
]

const coursePrices = [
  "free",
  "9.99",
  "19.99",
  "24.99",
  "29.99",
  "34.99",
  "39.99",
  "44.99",
  "49.99",
  "54.99",
  "59.99",
  "64.99",
  "69.99",
  "74.99",
  "75.99",
  "79.99",
  "84.99",
  "89.99",
  "94.99",
  "99.99"
]

const languages = [
  { code: 'en-us', name: 'English (US)' },
  { code: 'en-uk', name: 'English (UK)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'zh-tw', name: 'Chinese (Traditional)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  // Add more languages
];

const classLevels = [
  {code: 'beginner', name: 'Beginner Level'},
  {code: 'intermediate', name: 'Intermediate Level'},
  {code: 'advanced', name: 'Advanced Level'},
  {code: 'all', name: 'All Levels'}
]

const homeTableOptions = {
  padding: "dense",
  toolbar:true,
  paging: true,
  pageSize: 5, // Set your desired page size
  cellStyle: {
    whiteSpace: 'nowrap', // Prevent table data cells from wrapping
  },
  headerStyle: {
      backgroundColor: '#606060',
      color: '#FFF',
      fontSize: '12px',
      whiteSpace: 'nowrap',
  },
  rowStyle: {
    fontSize: '12px'
  },
}

const generalTableOptions = {
  padding: "dense",
  toolbar:true,
  paging:true,
  cellStyle: {
    whiteSpace: 'nowrap', // Prevent table data cells from wrapping
  },
  headerStyle: {
      backgroundColor: '#606060',
      color: '#FFF',
      fontSize: '12px',
      whiteSpace: 'nowrap',
  },
  rowStyle: {
    fontSize: '12px'
  },
  sorting: true,
  showTitle: false,
  actionsColumnIndex: -1,
  pageSize: 10
}

// const publishableKey = 'pk_test_51NBJiZJeXLoGLTej2au2xws1M3HiBfqBW5kjIteW4xhlWLnFah9JflsTMl3hRre4l31oYKSu7Il5YXJZjUrsuH5X00nLAjJGFz'
const publishableKey = 'pk_live_51NBJiZJeXLoGLTejtbiJL03MI9YZOLl8nJcn3JzBuKkqdaMUFpLbQ1OAf8zHRmaD1LphRKnT4vFVknOXx1l1sfTS00lqJEhMSm'

const step1DefaultData = {
  classId: '',
  classBanner: '',
  classLanguage: 'en-us',
  classTags: [],
  classLevel: '',
  classTitle: '',
  classDescription: ''
}

const step2DefaultData = {
  classEducators: [],
  classType: '',
  templateId: '',
  templateVersion: null,
  templateDetails: '',
  classStartDate:'',
  classEndDate:'',
  classStartTime: '',
  classEndTime:'',
  classVideoConference:'',
  classActiveDays: [],
  classExclusive: {
    value: '',
    code: ''
  },
  classPublish: false,
  classRecurring: {}
}

const step3DefaultData = {
  classPrice: '',
  classCoupons: []
}

const step4DefaultData = {
  classAnnouncements: [],
  classMaterials: [],
  classChapters: []
}

// Define required fields for each step
const requiredFields = {
  0: ['classTitle', 'classDescription', 'classLevel', 'classLanguage', 'classTags'],
  1: ['classEducators', 'templateId', 'templateVersion', 'classType',
      'classStartDate', 'classEndDate', 'classVideoConference'],
  2: ['classPrice'],
  3: [''],
  4: [''],
};



module.exports = {
  responsive,
  stockImage,
  s3BucketUrl,
  userIcons,
  secret,
  weekDays,
  repeatEvents,
  reactAPIURL,
	backendAPIURL,
  stgName,
  sampleFile,
  root, media,
  card_media,
  card_media_pointer,
  videoConferenceInfo,
  templateSteps, url,
  socketUrl, templateTypes,
  templateSizes,
  classSteps, enrollURL,
  templateTiers,
  classCategories,
  coursePrices,
  homeTableOptions,
  generalTableOptions,
  languages, classLevels,
  publishableKey,
  step1DefaultData,
  step2DefaultData,
  step3DefaultData,
  step4DefaultData,
  requiredFields,
  studentSteps,
  templateEditorText
};

const localOverrides = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('rdict-admin-config') || '{}') : {});

export const timetableConfig = localOverrides.timetableConfig || {
    institutes: [
        { id: 'online',   name: 'Online',   label: 'Zoom Class' },
        { id: 'kegalle',  name: 'Kegalle',  label: 'Science Center' },
        { id: 'ratnapura',name: 'Ratnapura',label: 'Nenik' },
        { id: 'gampaha',  name: 'Gampaha',  label: 'Indeepa' }
    ],
    defaultInstitute: 'online',
    batches: [
        {
            id: '2028',
            title: '2028 නව කණ්ඩායම',
            emoji: '💜',
            description: 'දශකයකට ආසන්නව දරුවන් හොයන පංතියේ අසුනක් 🤍',
            image: '/src/assets/Images/2026.png',
            schedules: [
                { institute: 'kegalle',   day: 'Monday',    time: '01:00 PM - 04:30 PM' },
                { institute: 'kegalle',   day: 'Thursday',  time: '08:30 AM - 12:00 PM' },
                { institute: 'ratnapura', day: 'Tuesday',   time: '08:00 AM - 12:30 PM' },
                { institute: 'ratnapura', day: 'Friday',    time: '01:00 PM - 04:30 PM' },
                { institute: 'gampaha',   day: 'Wednesday', time: '02:30 PM - 06:00 PM' },
                { institute: 'online',    day: 'Monday', time: '07:00 PM - 09:30 PM' },
                { institute: 'gampaha',   day: 'Saturday',  time: '08:30 AM - 12:30 PM' }
            ]
        },
        {
            id: '2027',
            title: '2027 පුනරීක්ෂණ',
            emoji: '🔥',
            description: 'වැරදුන තැන් හදාගෙන අලුත් ගමනක් යන්න 🤍',
            image: '/src/assets/Images/2027.png',
            schedules: [
                { institute: 'kegalle',   day: 'Sunday', time: '01:00 PM - 05:00 PM' },
                { institute: 'ratnapura', day: 'Monday', time: '08:30 AM - 12:00 PM' },
                { institute: 'online',    day: 'Monday', time: '07:00 PM - 09:30 PM' },
                { institute: 'gampaha',   day: 'Friday', time: '02:30 PM - 06:30 PM' }
            ]
        },
        {
            id: '2026',
            title: '2026 Paper Class',
            emoji: '🏆',
            description: 'අවසන් මොහොතේ ඉහළම ප්‍රතිඵලයක් කරා 🤍',
            image: '/src/assets/Images/20281.png',
            schedules: [
                { institute: 'online',    day: 'Monday',    time: '07:00 PM - 09:30 PM', type: 'Theory' },
                { institute: 'online',    day: 'Wednesday', time: '07:00 PM - 09:30 PM', type: 'Revision' },
                { institute: 'online',    day: 'Saturday',  time: '09:00 AM - 12:00 PM', type: 'Paper' },
                { institute: 'kegalle',   day: 'Tuesday',   time: '01:00 PM - 04:00 PM', type: 'Theory' },
                { institute: 'kegalle',   day: 'Thursday',  time: '01:00 PM - 04:00 PM', type: 'Revision' },
                { institute: 'kegalle',   day: 'Saturday',  time: '01:00 PM - 05:00 PM', type: 'Paper' },
                { institute: 'ratnapura', day: 'Monday',    time: '08:30 AM - 11:30 AM', type: 'Theory' },
                { institute: 'ratnapura', day: 'Wednesday', time: '08:30 AM - 11:30 AM', type: 'Revision' },
                { institute: 'ratnapura', day: 'Friday',    time: '01:00 PM - 05:00 PM', type: 'Paper' },
                { institute: 'gampaha',   day: 'Tuesday',   time: '02:30 PM - 05:30 PM', type: 'Theory' },
                { institute: 'gampaha',   day: 'Thursday',  time: '02:30 PM - 05:30 PM', type: 'Revision' },
                { institute: 'gampaha',   day: 'Sunday',    time: '09:00 AM - 01:00 PM', type: 'Paper' }
            ]
        }
    ]
};

export const contactConfig = localOverrides.contactConfig || {
    hotline: "077 123 4567",
    email: "info@rdict.lk"
};

export const socialConfig = localOverrides.socialConfig || {
    facebook: "https://facebook.com",
    whatsapp: "https://whatsapp.com",
    youtube: "https://youtube.com",
    tiktok: "https://tiktok.com"
};

export const globalToggles = localOverrides.globalToggles || {
    chatbot: true,
    particles: true,
    music: false
};

export const siteStats = localOverrides.siteStats || {
    hero: {
        students: { target: 1000, suffix: "+" },
        passRate: { target: 95, suffix: "%" },
        experience: { target: 5, suffix: "+" }
    }
};

export const youtubeVideos = localOverrides.youtubeVideos || [
    { id: "bB35uFMWWuM", thumbnail: "/src/assets/Images/Tutorials/Logic Gates Seminar.png" },
    { id: "aBuQ3BJwMrs", thumbnail: "/src/assets/Images/Tutorials/Networking 1st.png" },
    { id: "QZPmSHSA3F8&t", thumbnail: "/src/assets/Images/Tutorials/Mind map 1.png" },
    { id: "q2M6D-spkdY&t", thumbnail: "/src/assets/Images/Tutorials/Mind map 2.png" },
    { id: "gO_Za8TEAkI", thumbnail: "/src/assets/Images/Tutorials/MCQ.png" },
    { id: "3izzybaD6Q8", thumbnail: "/src/assets/Images/Tutorials/pu.png" }
];

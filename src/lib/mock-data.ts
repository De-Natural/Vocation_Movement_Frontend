import type {
  Student,
  Sponsor,
  ThankYouMessage,
  RecurringSponsorship,
  PlatformStats,
  Bill,
  Contribution,
} from "./types";

/* Portrait images (Unsplash) — configured as remote patterns in next.config. */
const P = (id: string, sig: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70&sig=${sig}`;

const PHOTOS = [
  P("photo-1507003211169-0a1dd7228f2d", 1),
  P("photo-1500648767791-00dcc994a43e", 2),
  P("photo-1531384441138-2736e62e0919", 3),
  P("photo-1519085360753-af0119f7cbe7", 4),
  P("photo-1506794778202-cad84cf45f1d", 5),
  P("photo-1544005313-94ddf0286df2", 6),
  P("photo-1502823403499-6ccfcf4fb453", 7),
  P("photo-1521119989659-a83eee488004", 8),
  P("photo-1500649297466-74794c70acfc", 9),
  P("photo-1487412720507-e7ab37603c6f", 10),
];

const CHAPEL = P("photo-1438032005730-c779502df39b", 20);

const CONGREGATIONS = [
  "Missionaries of the Precious Blood",
  "Sisters of the Sacred Heart",
  "Order of Preachers (Dominicans)",
  "Society of the Divine Word",
  "Congregation of the Holy Spirit",
  "Franciscan Friars Minor",
];

const SCHOOLS = [
  "St. Joseph Major Seminary",
  "Bigard Memorial Seminary",
  "SS. Peter & Paul Seminary",
  "Sacred Heart Novitiate",
  "St. Augustine Formation House",
];

function mkContribution(
  billId: string,
  donorName: string,
  anonymous: boolean,
  amount: number,
  date: string,
  txn: string,
  recurring = false
): Contribution {
  return {
    id: `c-${txn}`,
    billId,
    donorName: anonymous ? "Anonymous" : donorName,
    anonymous,
    amount,
    date,
    transactionId: txn,
    status: "Confirmed",
    recurring,
  };
}

/** Build a student's bill set with contributions folded in. */
function mkBills(studentId: string, seed: number): Bill[] {
  const defs: Array<{
    name: string;
    category: Bill["category"];
    total: number;
    raised: number;
    due: string;
    desc: string;
  }> = [
    {
      name: "School Fees — Session 2026",
      category: "School Fees",
      total: 1200,
      raised: [1200, 640, 300, 980][seed % 4],
      due: "2026-10-15",
      desc: "Tuition and boarding for the current formation session.",
    },
    {
      name: "Medical & Health Cover",
      category: "Medical",
      total: 400,
      raised: [120, 400, 45, 210][seed % 4],
      due: "2026-09-01",
      desc: "Annual health insurance and clinic visits.",
    },
    {
      name: "Books & Study Materials",
      category: "Books",
      total: 260,
      raised: [260, 130, 60, 200][seed % 4],
      due: "2026-09-20",
      desc: "Theology and philosophy texts for the semester.",
    },
    {
      name: "Cassock & Clothing Allowance",
      category: "Clothing",
      total: 180,
      raised: [90, 180, 30, 150][seed % 4],
      due: "2026-08-30",
      desc: "Liturgical vestments and everyday clothing.",
    },
    {
      name: "Feeding — Quarterly",
      category: "Feeding",
      total: 300,
      raised: [150, 300, 75, 240][seed % 4],
      due: "2026-08-10",
      desc: "Meals within the formation house.",
    },
  ];

  return defs.map((d, i) => {
    const billId = `${studentId}-b${i + 1}`;
    const percent = Math.round((d.raised / d.total) * 100);
    const overdue = new Date(d.due).getTime() < Date.parse("2026-08-18");
    const status: Bill["status"] =
      percent >= 100 ? "Fully Funded" : overdue ? "Overdue" : "Active";

    // A couple of illustrative contributions per bill.
    const contributions: Contribution[] = [];
    if (d.raised > 0) {
      contributions.push(
        mkContribution(
          billId,
          ["Mrs. Onyeka A.", "Mr. Chukwuma O.", "The Grace Foundation"][i % 3],
          i % 2 === 0,
          Math.round(d.raised * 0.6),
          "2026-08-03",
          `TXN-${88201 + seed * 7 + i}A`
        ),
        mkContribution(
          billId,
          ["Mr. David N.", "Anonymous Friend", "St. Rita Guild"][i % 3],
          i % 2 === 1,
          d.raised - Math.round(d.raised * 0.6),
          "2026-07-22",
          `TXN-${55872 + seed * 3 + i}D`
        )
      );
    }

    return {
      id: billId,
      studentId,
      name: d.name,
      category: d.category,
      total: d.total,
      raised: d.raised,
      dueDate: d.due,
      description: d.desc,
      status,
      contributions,
    };
  });
}

const NAMES = [
  "Brother Emeka Okonkwo",
  "Sister Maria Adeyemi",
  "Brother Thomas Mensah",
  "Sister Grace Nwosu",
  "Brother Peter Achebe",
  "Sister Cecilia Okafor",
  "Brother John Baptiste",
  "Sister Anne Chukwu",
  "Brother Michael Eze",
  "Sister Rose Abara",
];

const STAGES: Student["formationStage"][] = [
  "Seminarian",
  "Novice",
  "Postulant",
];

const BIOS = [
  "I entered formation three years ago after finishing my studies in the sciences. My heart was drawn to serve the poor and to preach the mercy of God. Each day of study and prayer deepens my conviction. With your support I can continue my journey toward the priesthood and one day serve a rural parish that has waited many years for a resident priest.",
  "From a young age I felt called to religious life through the example of the sisters who taught in my village. I am now in my novitiate year, learning to live in community, in prayer, and in service to children who have no one. Your generosity helps me stay in formation and become the sister God is calling me to be.",
  "I am the first in my family to pursue religious formation. The road has not been easy — my parents are farmers and cannot cover the seminary fees. Yet I trust in Providence and in the kindness of benefactors like you. I dream of becoming a missionary priest bringing the sacraments to remote communities.",
];

export const students: Student[] = NAMES.map((name, i) => {
  const id = `stu-${i + 1}`;
  const slug = name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  const bills = mkBills(id, i);
  return {
    id,
    slug,
    name,
    photo: PHOTOS[i],
    formationStage: STAGES[i % 3],
    congregation: CONGREGATIONS[i % CONGREGATIONS.length],
    school: SCHOOLS[i % SCHOOLS.length],
    country: ["Nigeria", "Ghana", "Kenya", "Uganda"][i % 4],
    location: ["Enugu, Nigeria", "Accra, Ghana", "Nairobi, Kenya", "Kampala, Uganda"][i % 4],
    dateOfBirth: "1999-04-12",
    gender: i % 2 === 0 ? "Male" : "Female",
    yearOfFormation: `Year ${(i % 4) + 1}`,
    expectedYear: `${2027 + (i % 3)}`,
    biography: BIOS[i % BIOS.length],
    verification: i === 9 ? "Pending Verification" : "Verified",
    createdAt: `2026-0${(i % 8) + 1}-1${i % 9}`,
    bills,
    sponsorCount: 3 + ((i * 7) % 24),
    profileCompletion: [100, 85, 100, 70, 90, 100, 60, 95, 100, 45][i],
  };
});

/** The signed-in student for the student-facing dashboards (first record). */
export const currentStudent = students[0];

export const sponsor: Sponsor = {
  id: "spo-1",
  name: "Mrs. Onyeka Adeleke",
  email: "onyeka.a@example.com",
  country: "Nigeria",
  currency: "USD",
  anonymousByDefault: false,
  totalGiven: 2480,
  studentsSponsored: 6,
  activeRecurring: 3,
  monthlyCommitment: 180,
};

export const recurringSponsorships: RecurringSponsorship[] = [
  {
    id: "rec-1",
    studentId: "stu-1",
    studentName: students[0].name,
    studentPhoto: students[0].photo,
    amount: 80,
    billName: "School Fees — Session 2026",
    active: true,
    nextDate: "2026-09-03",
  },
  {
    id: "rec-2",
    studentId: "stu-3",
    studentName: students[2].name,
    studentPhoto: students[2].photo,
    amount: 60,
    billName: "Feeding — Quarterly",
    active: true,
    nextDate: "2026-09-05",
  },
  {
    id: "rec-3",
    studentId: "stu-5",
    studentName: students[4].name,
    studentPhoto: students[4].photo,
    amount: 40,
    billName: "Books & Study Materials",
    active: false,
    nextDate: "2026-09-10",
  },
];

export const messages: ThankYouMessage[] = [
  {
    id: "msg-1",
    studentId: "stu-1",
    studentName: students[0].name,
    studentPhoto: students[0].photo,
    sponsorName: "Mrs. Onyeka A.",
    anonymousDonor: false,
    subject: "Thank you for funding my school fees",
    body: "Dear Mrs. Onyeka, words cannot express my gratitude. Your gift toward my school fees means I can continue my studies without interruption this session. I remember you in my daily prayers. May God bless you abundantly.",
    date: "2026-08-04",
    read: false,
    replies: [
      {
        id: "r-1",
        from: "sponsor",
        body: "You are most welcome, Brother Emeka. It is my joy to support your vocation. Keep up your studies!",
        date: "2026-08-05",
      },
    ],
  },
  {
    id: "msg-2",
    studentId: "stu-1",
    studentName: students[0].name,
    studentPhoto: students[0].photo,
    sponsorName: "Anonymous (via Admin)",
    anonymousDonor: true,
    subject: "Gratitude for the medical cover",
    body: "To my anonymous benefactor — thank you for covering my medical needs. I was able to see the doctor and I am now well. Your kindness, though hidden, is seen by God.",
    date: "2026-07-21",
    read: true,
    replies: [],
  },
  {
    id: "msg-3",
    studentId: "stu-1",
    studentName: students[0].name,
    studentPhoto: students[0].photo,
    sponsorName: "The Grace Foundation",
    anonymousDonor: false,
    subject: "Books have arrived — thank you!",
    body: "Thank you for the gift toward my books. I have now received all my theology texts for the semester and can study properly. God reward you.",
    date: "2026-07-10",
    read: true,
    replies: [
      {
        id: "r-2",
        from: "sponsor",
        body: "Wonderful news! We are proud to walk this journey with you.",
        date: "2026-07-11",
      },
    ],
  },
];

export const platformStats: PlatformStats = {
  studentsSupported: 248,
  fundsRaised: 1284500,
  sponsors: 1120,
  activeSponsorships: 386,
};

export const testimonials = [
  {
    quote:
      "The support I received let me finish my seminary formation. I am now ordained and serving my first parish. I will never forget the kindness of my sponsors.",
    name: "Fr. Anthony Ude",
    congregation: "Missionaries of the Precious Blood",
    photo: PHOTOS[6],
  },
  {
    quote:
      "As a novice I had nothing. Through this platform, benefactors covered my needs and my heart was set free to pray and to serve. Thank you for believing in my vocation.",
    name: "Sr. Bernadette Okoli",
    congregation: "Sisters of the Sacred Heart",
    photo: PHOTOS[7],
  },
  {
    quote:
      "Transparency is what moved me. I could see exactly which bill my gift paid, and I received a thank-you note from the very student I helped. That is beautiful.",
    name: "Mr. Chukwuma O.",
    congregation: "Sponsor since 2025",
    photo: PHOTOS[8],
  },
];

export const heroImage = CHAPEL;

/** Featured students for landing page (first 6). */
export const featuredStudents = students.slice(0, 6);

/** Payment history rows (received) — mirrors the PRD §4.5 example table. */
export const receivedPayments: Contribution[] = [
  mkContribution("stu-1-b1", "Mrs. Onyeka A.", false, 120, "2026-08-03", "TXN-88201A"),
  mkContribution("stu-1-b4", "Anonymous", true, 45, "2026-07-29", "TXN-77113B"),
  mkContribution("stu-1-b2", "Mr. Chukwuma O.", false, 200, "2026-07-20", "TXN-66994C"),
  mkContribution("stu-1-b5", "Anonymous", true, 60, "2026-07-15", "TXN-55872D"),
  mkContribution("stu-1-b3", "The Grace Foundation", false, 130, "2026-07-02", "TXN-44120E"),
  mkContribution("stu-1-b1", "Mr. David N.", false, 250, "2026-06-24", "TXN-33098F", true),
];

/** Payment history rows (sent) — sponsor perspective. */
export const sentPayments: Array<Contribution & { studentName: string; billName: string }> = [
  { ...receivedPayments[0], studentName: students[0].name, billName: "School Fees Q3" },
  { ...mkContribution("stu-3-b2", "You", false, 200, "2026-07-28", "TXN-90455G"), studentName: students[2].name, billName: "Medical Bill" },
  { ...mkContribution("stu-5-b3", "You", true, 60, "2026-07-14", "TXN-81233H"), studentName: students[4].name, billName: "Books & Study Materials" },
  { ...mkContribution("stu-1-b1", "You", false, 80, "2026-07-03", "TXN-72910J", true), studentName: students[0].name, billName: "School Fees — Session 2026" },
];

export function getStudentBySlug(slug: string): Student | undefined {
  return students.find((s) => s.slug === slug);
}

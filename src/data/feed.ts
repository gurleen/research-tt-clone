import type { FeedVideo } from "../types/feed";

/**
 * Add your research videos here.
 * 1. Drop files in public/videos/
 * 2. Set videoUrl to "/videos/your-file.mp4"
 * 3. Fill in metadata and comments below
 */

// video 1: DJ Khaled explains how to pronounce "baklava"
// video 2: "stop, I coulda dropped my croissant" vine
// video 3: freestyle dance instructor intro
export const feedVideos: FeedVideo[] = [
  {
    id: "1",
    videoUrl:
      "https://images.dragonstv.io/test-videos/baklava.webm",
    creator: {
      username: "DJ Khaled",
      avatarUrl: undefined,
    },
    caption: "How to pronounce 'baklava' like a boss",
    hashtags: ["baklava", "djkhaled", "fyp"],
    audioTrack: "original sound - DJ Khaled",
    likeCount: 64800,
    commentCount: 2331,
    shareCount: 5120,
    saveCount: 890,
    comments: [
      {
        id: "c1",
        username: "foodie_forever",
        text: "I’ve been saying it wrong my whole life 😭",
        timestamp: "2d ago",
      },
      {
        id: "c2",
        username: "another_one_fan",
        text: "Another one! 🗣️",
        timestamp: "2d ago",
      },
      {
        id: "c3",
        username: "mediterranean_mom",
        text: "As someone from the Middle East… he’s actually close??",
        timestamp: "1d ago",
      },
      {
        id: "c4",
        username: "baklava_hater",
        text: "Wait I thought it was back-LAH-vuh",
        timestamp: "1d ago",
      },
      {
        id: "c5",
        username: "major_key_only",
        text: "This man can make anything sound inspirational",
        timestamp: "18h ago",
      },
      {
        id: "c6",
        username: "grocery_store_guy",
        text: "Going to the bakery tomorrow just to test this",
        timestamp: "5h ago",
      },
    ],
  },
  {
    id: "2",
    videoUrl:
      "https://images.dragonstv.io/test-videos/croissant.webm",
    creator: {
      username: "vine_archives",
      avatarUrl: undefined,
    },
    caption: "Stop, I coulda dropped my croissant",
    hashtags: ["vine", "croissant", "classic"],
    audioTrack: "original sound - vine",
    likeCount: 12400,
    commentCount: 456,
    shareCount: 890,
    saveCount: 120,
    comments: [
      {
        id: "c7",
        username: "2014_called",
        text: "The way this lives rent free in my head forever",
        timestamp: "3d ago",
      },
      {
        id: "c8",
        username: "pastry_panic",
        text: "NOT THE CROISSANT 💀",
        timestamp: "2d ago",
      },
      {
        id: "c9",
        username: "gen_z_confused",
        text: "Why is this so dramatic I’m crying",
        timestamp: "1d ago",
      },
      {
        id: "c10",
        username: "french_bakery",
        text: "As a baker this is painfully accurate",
        timestamp: "22h ago",
      },
      {
        id: "c11",
        username: "stoppppp",
        text: "STOP 😂 I coulda dropped MY croissant",
        timestamp: "8h ago",
      },
    ],
  },
  {
    id: "3",
    videoUrl:
      "https://images.dragonstv.io/test-videos/freestyle-dance.webm",
    creator: {
      username: "Freestyle Dance Instructor",
      avatarUrl: undefined,
    },
    caption: "Freestyle dance instructor intro",
    hashtags: ["dance", "freestyle", "fyp"],
    audioTrack: "original sound - Freestyle Dance Instructor",
    likeCount: 982000,
    commentCount: 45000,
    shareCount: 12000,
    comments: [
      {
        id: "c12",
        username: "two_left_feet",
        text: "I tried this in my kitchen and immediately regretted it",
        timestamp: "1w ago",
      },
      {
        id: "c13",
        username: "dance_studio_nyc",
        text: "The energy in this intro alone deserves a class",
        timestamp: "5d ago",
      },
      {
        id: "c14",
        username: "choreo_queen",
        text: "Okay but the footwork at the end?? 🔥",
        timestamp: "4d ago",
      },
      {
        id: "c15",
        username: "sign_me_up",
        text: "Where do I enroll asking for a friend",
        timestamp: "3d ago",
      },
      {
        id: "c16",
        username: "wedding_mvp",
        text: "Adding this to my reception playlist immediately",
        timestamp: "2d ago",
      },
      {
        id: "c17",
        username: "respectfully",
        text: "Sir this is a Wendy’s… but also teach me",
        timestamp: "1d ago",
      },
      {
        id: "c18",
        username: "loop_10x",
        text: "On my 47th rewatch and it still hits",
        timestamp: "6h ago",
      },
    ],
  },
];

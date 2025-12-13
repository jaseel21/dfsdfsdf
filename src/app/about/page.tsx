"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import YoutubeEmbed from "@/components/about/YoutubeEmbed";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("mission");

  const team = [
    {
      name: "Sayyid Hameed Ali Shihab Thangal",
      position: "President AIC",
      bio: "A visionary leader dedicated to Islamic education and community welfare, guiding AIC&apos;s mission with wisdom and compassion.",
      image: "/images/Thangal.jpg",
      expertise: ["Leadership", "Community Development", "Islamic Education"],
      experience: "🏆",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "president@aicedu.in"
      }
    },
    {
      name: "Musthafa Hudawi Akode",
      position: "Secretary AIC",
      bio: "An experienced educator and administrator, ensuring the smooth operation of all AIC programs and initiatives.",
      image: "/images/Musthafa-usthad.jpg",
      expertise: ["Administration", "Educational Programs", "Visionary Planning"],
      experience: "🏆",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "secretary@aicedu.in"
      }
    },
    {
      name: "M.P Abdulla Haji Parakkadavu",
      position: "Treasurer AIC",
      bio: "A trusted financial steward, managing resources responsibly to maximize impact for students and orphans.",
      image: "/images/abdulla-haji.webp",
      expertise: ["Financial Management", "Strategic Planning", "Compliance"],
      experience: "🏆",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#"
      }
    }
  ];

  const milestones = [
    {
      year: "2000",
      title: "Akode Islamic Centre Founded",
      description: "Established as an educational and cultural hub with a mission to support orphans and promote Islamic learning.",
      icon: "🕌",
    },
    {
      year: "2005",
      title: "Hifz Program Launched",
      description: "Oorkadavu Qasim Musliyar Thahfeezul Quran College began, offering Quran memorization to students.",
      icon: "📖",
    },
    {
      year: "2010",
      title: "Orphan Care Initiative",
      description: "Started caring for 10+ orphans, ensuring they live safely with their mothers under AIC&apos;s support.",
      icon: "👨‍👩‍👧‍👦",
    },
    {
      year: "2015",
      title: "Expansion of Institutes",
      description: "Added Islamic Da'wa Academy, Daiya Islamic Academy, and AMUP School to enhance educational offerings.",
      icon: "🏫",
    },
    {
      year: "2020",
      title: "Cultural and Nursery Programs",
      description: "Introduced Bright Public Nursery School and Ayaadi Life Education to broaden community impact.",
      icon: "🌱",
    },
  ];

  const institutes = [
    {
      name: "Oorkadavu Qasim Musliyar Thahfeezul Quran College",
      description: "Premier institute for Quran memorization (Hifz Program) with traditional and modern teaching methods.",
      icon: "📖",
    },
    {
      name: "Islamic Da'wa Academy",
      description: "Higher studies program for boys after completing Hifz, focusing on Islamic sciences and modern education.",
      icon: "🎓",
    },
    {
      name: "Daiya Islamic Academy",
      description: "Higher studies program for girls after SSLC, empowering women through Islamic and contemporary education.",
      icon: "👩‍🎓",
    },
    {
      name: "AMUP School",
      description: "Aided Upper Primary School providing foundational education with moral development and academic excellence.",
      icon: "🏫",
    },
    {
      name: "Bright Public Nursery School",
      description: "Early childhood education focusing on holistic development with Islamic values and play-based learning.",
      icon: "🌱",
    },
    {
      name: "Ayaadi Life Education",
      description: "Comprehensive life skills and Islamic values education preparing students for real-world challenges.",
      icon: "✨",
    },
  ];

  const stats = [
    { value: "25+", label: "Years of Service" },
    { value: "600+", label: "Orphans Supported" },
    { value: "6", label: "Educational Institutes" },
    { value: "1000+", label: "Students Educated" },
  ];

  const tabs = [
    { id: "mission", label: "Our Mission", icon: "🎯" },
    { id: "timeline", label: "Our Journey", icon: "⏰" },
    { id: "team", label: "Our Team", icon: "👥" },
    { id: "institutes", label: "Our Institutes", icon: "🏛️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Back Button + Logo */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/" 
                className="flex items-center space-x-2 group hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Back</span>
              </Link>
              {/* <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1 sm:p-1.5"> */}
                <Image
                  src="/aic-amal-logo.svg"
                  alt="AIC Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              {/* </div> */}
              <span className="hidden sm:block font-bold text-gray-900 dark:text-white text-lg">Akode Islamic Centre</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 xl:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden xl:block">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-2 text-sm font-medium border-0 focus:ring-2 focus:ring-indigo-500"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.icon} {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern Card Design */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main Hero Card with Glassmorphism */}
            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800"></div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

              <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16">
                <div className="text-center max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full mb-6 sm:mb-8"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs sm:text-sm">About Akode Islamic Centre</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white"
                  >
                    <span className="block">Transforming Lives</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      Through Education
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed"
                  >
                    Discover our mission to educate, uplift orphans, and enrich our community through culture and faith.
                  </motion.p>

                  {/* Stats Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                  >
                    {stats.map((stat, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-lg border border-gray-200/50 dark:border-gray-600/50"
                      >
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-2">{stat.value}</div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            {/* Mission Tab */}
            {activeTab === "mission" && (
              <motion.div
                key="mission"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-16"
              >
                {/* Mission Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                  <div className="order-2 lg:order-1">
                    <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 sm:mb-6">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs sm:text-sm">Our Mission</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">
                      Nurturing Education and <span className="text-indigo-600 dark:text-indigo-400">Orphan Care</span>
                    </h2>
                    <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      <p>
                        Akode Islamic Centre (AIC) is dedicated to providing exceptional Islamic education and comprehensive care for orphans. As an Educational & Cultural Centre, we operate over six institutes, serving our community with faith-based learning and cultural enrichment.
                      </p>
                      <p>
                        We proudly support over 600 orphans, ensuring they live safely and happily at home with their mothers. Our holistic approach combines spiritual growth, academic excellence, and community welfare, rooted in Islamic values.
                      </p>
                    </div>
                    <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {[
                        "Quran memorization and Islamic education",
                        "Care for 600+ orphans with their families",
                        "Higher studies for boys and girls",
                        "Cultural and primary education programs",
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="relative order-1 lg:order-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <YoutubeEmbed videoId={process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID || "qCPvfZh2HoA"} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-16"
              >
                <div className="text-center">
                  <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-4 sm:mb-6">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs sm:text-sm">Our Journey</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                    Key Milestones
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    A journey of education, welfare, and cultural impact spanning over two decades.
                  </p>
                </div>

                <div className="relative">
                  <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-indigo-300 via-purple-400 to-indigo-300 dark:from-indigo-600 dark:via-purple-600 dark:to-indigo-600 rounded-full"></div>
                  <div className="space-y-16">
                    {milestones.map((milestone, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`flex flex-col lg:flex-row ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center`}
                      >
                        <div className="w-full lg:w-5/12">
                          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shadow-lg">
                                {milestone.icon}
                              </div>
                              <div>
                                <div className="px-3 sm:px-4 py-1 sm:py-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full inline-block">
                                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs sm:text-sm">{milestone.year}</span>
                                </div>
                              </div>
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                              {milestone.title}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center justify-center w-2/12">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg"></div>
                        </div>
                        <div className="hidden lg:block w-5/12"></div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Team Tab */}
            {activeTab === "team" && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-16"
              >
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full mb-6">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">✨ Our Leadership Team</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                    The Heart of AIC
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    Meet the passionate individuals driving our mission forward with dedication, expertise, and unwavering commitment to Islamic education and community welfare.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {team.map((member, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-500"
                    >
                      {/* Member Image */}
                      <div className="relative h-80 overflow-hidden">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
                        
                        {/* Experience Badge */}
                        <div className="absolute top-4 right-4">
                          <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {member.experience}
                          </div>
                        </div>

                        {/* Social Links Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                          <div className="flex justify-center space-x-3">
                            {Object.entries(member.social).map(([platform, link]) => (
                              <motion.a
                                key={platform}
                                href={link}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                              >
                                {platform === 'email' && (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                  </svg>
                                )}
                                {platform === 'linkedin' && (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                                  </svg>
                                )}
                                {platform === 'twitter' && (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                                  </svg>
                                )}
                              </motion.a>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Member Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-3 text-sm">{member.position}</p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-4">{member.bio}</p>
                        
                        {/* Expertise Tags */}
                        <div className="flex flex-wrap gap-2">
                          {member.expertise.map((skill, skillIndex) => (
                            <span 
                              key={skillIndex}
                              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Premium Accent */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    </motion.div>
                  ))}
                </div>

                {/* Call to Action */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-center mt-16"
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Join Our Mission</h3>
                    <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                      Interested in contributing to our cause? We&apos;re always looking for dedicated individuals to join our team and make a difference in the lives of students and orphans.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg"
                    >
                      Get In Touch
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Institutes Tab */}
            {activeTab === "institutes" && (
              <motion.div
                key="institutes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-16"
              >
                <div className="text-center">
                  <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-4 sm:mb-6">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs sm:text-sm">Our Institutes</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                    Educational Excellence
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Explore our six institutes fostering Islamic education and academic success.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {institutes.map((institute, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shadow-lg">
                          {institute.icon}
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
                        {institute.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{institute.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-white shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                    Support AIC&apos;s Mission
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-8 sm:mb-12 max-w-2xl mx-auto">
                    Your donations educate students and support over 600 orphans, building a brighter future for our community.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                    <Link
                      href="/donation"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-700 rounded-xl sm:rounded-2xl font-semibold hover:bg-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      Donate Now
                    </Link>
                    <Link
                      href="/contact"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white rounded-xl sm:rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300 text-sm sm:text-base"
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
import type { BranchFamily, OfficialProgram, OfficialProgramGender } from "@/types";
import { instituteSummarySource } from "./sources";

function program(
  choiceCode: string,
  instituteCode: string,
  name: string,
  branchFamily: BranchFamily,
  intake: number,
  gender: OfficialProgramGender = "Co-Education",
  shift: OfficialProgram["shift"] = "General Shift",
): OfficialProgram {
  return { choiceCode, instituteCode, name, branchFamily, intake, gender, shift, source: instituteSummarySource(instituteCode) };
}

export const officialPrograms = [
  program("0600419110", "06004", "Civil Engineering", "Civil & Core", 60),
  program("0600424510", "06004", "Computer Engineering", "Computer & IT", 60),
  program("0600437210", "06004", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 60),
  program("0600446410", "06004", "Instrumentation and Control Engineering", "Electronics & Electrical", 60),
  program("0600460210", "06004", "Automobile Engineering", "Mechanical & Automation", 60),
  program("0600461210", "06004", "Mechanical Engineering", "Mechanical & Automation", 60),

  program("0613924510", "06139", "Computer Engineering", "Computer & IT", 180),
  program("0613924610", "06139", "Information Technology", "Computer & IT", 120),
  program("0613937210", "06139", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 120),
  program("0613992110", "06139", "Artificial Intelligence and Machine Learning", "AI & Data", 60),
  program("0613999510", "06139", "Artificial Intelligence and Data Science", "AI & Data", 120),

  program("0614624510", "06146", "Computer Engineering", "Computer & IT", 360),
  program("0614624610", "06146", "Information Technology", "Computer & IT", 180),
  program("0614637210", "06146", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 180),
  program("0614650710", "06146", "Chemical Engineering", "Chemical & Biotechnology", 60),
  program("0614661210", "06146", "Mechanical Engineering", "Mechanical & Automation", 120),
  program("0614691110", "06146", "Computer Science and Engineering (Artificial Intelligence and Machine Learning)", "AI & Data", 180),

  program("0615624510", "06156", "Computer Engineering", "Computer & IT", 180),
  program("0615624610", "06156", "Information Technology", "Computer & IT", 180),
  program("0615629310", "06156", "Electrical Engineering", "Electronics & Electrical", 60),
  program("0615637210", "06156", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 180),
  program("0615699510", "06156", "Artificial Intelligence and Data Science", "AI & Data", 180),

  program("0617524510", "06175", "Computer Engineering", "Computer & IT", 240, "Co-Education", "Morning Shift"),
  program("0617524610", "06175", "Information Technology", "Computer & IT", 120),
  program("0617537210", "06175", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 180),
  program("0617561210", "06175", "Mechanical Engineering", "Mechanical & Automation", 180),
  program("0617591110", "06175", "Computer Science and Engineering (Artificial Intelligence and Machine Learning)", "AI & Data", 120),

  program("0617708210", "06177", "Biotechnology", "Chemical & Biotechnology", 60),
  program("0617719110", "06177", "Civil Engineering", "Civil & Core", 180),
  program("0617724510", "06177", "Computer Engineering", "Computer & IT", 180),
  program("0617724610", "06177", "Information Technology", "Computer & IT", 120),
  program("0617737210", "06177", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 240),
  program("0617750710", "06177", "Chemical Engineering", "Chemical & Biotechnology", 60),
  program("0617761210", "06177", "Mechanical Engineering", "Mechanical & Automation", 300),

  program("0620724510", "06207", "Computer Engineering", "Computer & IT", 240),
  program("0620724610", "06207", "Information Technology", "Computer & IT", 60),
  program("0620737210", "06207", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 180),
  program("0620791610", "06207", "Automation and Robotics", "Mechanical & Automation", 60),
  program("0620799510", "06207", "Artificial Intelligence and Data Science", "AI & Data", 180),

  program("0627124510", "06271", "Computer Engineering", "Computer & IT", 240),
  program("0627124610", "06271", "Information Technology", "Computer & IT", 180),
  program("0627126310", "06271", "Artificial Intelligence and Data Science", "AI & Data", 60),
  program("0627137210", "06271", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 240),
  program("0627184410", "06271", "Electronics and Computer Engineering", "Electronics & Electrical", 60),

  program("0627221910", "06272", "Robotics and Automation", "Mechanical & Automation", 60),
  program("0627224510", "06272", "Computer Engineering", "Computer & IT", 180),
  program("0627224610", "06272", "Information Technology", "Computer & IT", 180),
  program("0627237210", "06272", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 180),
  program("0627299510", "06272", "Artificial Intelligence and Data Science", "AI & Data", 180),

  program("0627324510", "06273", "Computer Engineering", "Computer & IT", 720),
  program("0627324610", "06273", "Information Technology", "Computer & IT", 360),
  program("0627337210", "06273", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 360),
  program("0627391110", "06273", "Computer Science and Engineering (Artificial Intelligence and Machine Learning)", "AI & Data", 360),
  program("0627399510", "06273", "Artificial Intelligence and Data Science", "AI & Data", 360),

  program("0627424510", "06274", "Computer Engineering", "Computer & IT", 120),
  program("0627424610", "06274", "Information Technology", "Computer & IT", 120),
  program("0627429310", "06274", "Electrical Engineering", "Electronics & Electrical", 60),
  program("0627437210", "06274", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 120),
  program("0627499510", "06274", "Artificial Intelligence and Data Science", "AI & Data", 60),

  program("0627624550F", "06276", "Computer Engineering", "Computer & IT", 180, "Female"),
  program("0627624650F", "06276", "Information Technology", "Computer & IT", 120, "Female"),
  program("0627637250F", "06276", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 180, "Female"),
  program("0627646450F", "06276", "Instrumentation and Control Engineering", "Electronics & Electrical", 60, "Female"),
  program("0627661250F", "06276", "Mechanical Engineering", "Mechanical & Automation", 60, "Female"),

  program("0627821910", "06278", "Robotics and Automation", "Mechanical & Automation", 60),
  program("0627824510", "06278", "Computer Engineering", "Computer & IT", 120),
  program("0627829310", "06278", "Electrical Engineering", "Electronics & Electrical", 60),
  program("0627837210", "06278", "Electronics and Telecommunication Engineering", "Electronics & Electrical", 60),
  program("0627892110", "06278", "Artificial Intelligence and Machine Learning", "AI & Data", 120),
] as const satisfies readonly OfficialProgram[];

import Dexie, { type Table } from 'dexie'

export interface Exam {
  id?: number
  name?: string
  date?: number
  subjectList?: string[] // 科目列表 顺序
  classList?: string[] // 班级列表 顺序
  examScoreList?: ExamScore[]
}

export interface ExamDB {
  id?: number
  name?: string
  date?: number
  subjectList?: string // 科目列表 顺序
  classList?: string // 班级列表 顺序
  examScoreList?: string
}

export interface ExamScore {
  id?: number
  studentNo?: string
  studentName?: string
  className?: string
  subjectName?: string
  score?: number
}

export class ExamDexie extends Dexie {
  exam!: Table<ExamDB>

  constructor() {
    super('examDB')
    this.version(1).stores({
      exam: '++id, name, date',
    })
  }
}

export class ExamScoreDexie extends Dexie {
  examScore!: Table<ExamScore[]>

  constructor() {
    super('examScoreDB')
    this.version(1).stores({
      examScore: '++id, examId',
    })
  }
}

export const examDexie = new ExamDexie()
export const examScoreDexie = new ExamScoreDexie()

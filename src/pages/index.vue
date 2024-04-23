<script setup lang="ts">
import ImportReport from './importReport.vue'
import type { Exam } from '~/db'
import { examDexie } from '~/db'

defineOptions({
  name: 'IndexPage',
})

const showImportReport = ref(false)
const reports = ref<Exam[]>([])

function getReportList() {
  examDexie.exam.toArray().then((res) => {
    res?.forEach((item) => {
      const { id, name, date, subjectList, classList, examScoreList } = item
      reports.value.push({
        id,
        name,
        date,
        subjectList: subjectList ? JSON.parse(subjectList) : null,
        classList: classList ? JSON.parse(classList) : null,
        examScoreList: examScoreList ? JSON.parse(examScoreList) : null,
      })
    })
  })
}

function complete() {
  showImportReport.value = false
  getReportList()
}

onMounted(() => {
  getReportList()
})
</script>

<template>
  <div mx-auto max-w-1100px min-w-600px>
    <el-row justify="center" :gutter="20">
      <el-col :span="17">
        <div min-h-36px rounded-4px bg-red-100 />
      </el-col>
      <el-col :span="7">
        <div min-h-36px rounded-4px bg-red-200>
          <el-button @click="() => showImportReport = true">
            新增
          </el-button>
          <p v-for="(item, index) in reports" :key="index">
            {{ item.name }}
          </p>
        </div>
      </el-col>
    </el-row>
  </div>
  <ImportReport :is-show="showImportReport" @complete="complete" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'
import { genFileId } from 'element-plus'
import { read, utils } from 'xlsx'
import type { Exam, ExamScore } from '~/db'
import { examDexie } from '~/db'
import * as NP from '~/utils/NumberPrecision'

defineProps({
  isShow: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['complete'])
const activeStep = ref(1)
const nextStepLoading = ref(false)
const uploadFile = ref()

// 文件解析数据
const exam = ref<Exam>({})
const examScoreList = ref<ExamScore[]>([])
const headers = ref()
const rows = ref()
const tableHeight = ref(200)

const uploadRef = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
  uploadRef.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  uploadRef.value!.handleStart(file)
}

const importFile: UploadProps['onChange'] = async (file) => {
  uploadFile.value = file.raw
  console.log(uploadFile.value, 'file')
  await importAB(await uploadFile.value.arrayBuffer())
}

async function importAB(ab: ArrayBuffer): Promise<void> {
  const data = read(ab)
  console.log(data.SheetNames, 'sheets')
  console.log(data.SheetNames?.[0], 'currSheet')
  console.log(data.Sheets, 'workBook')
  const sheetJson: any[] = utils.sheet_to_json(data.Sheets[data.SheetNames?.[0]], {
    header: 1,
    raw: false,
    blankrows: false,
  })
  console.log(sheetJson, 'sheetJson')
  tableHeight.value = sheetJson.length * 30
  headers.value = sheetJson[0].map((header: string, key: number) => ({
    index: key,
    key: header,
    dataKey: header,
    title: header,
    width: 100,
  }))
  console.log(headers.value, 'header')

  rows.value = sheetJson.slice(1).map((row: string[]) => {
    return headers.value.reduce((obj: any, header: any, index: number) => {
      obj[header.key] = row[index]
      return obj
    }, {})
  })

  console.log(rows.value, 'rows')

  exam.value.subjectList = sheetJson[0].slice(3)
  exam.value.classList = Array.from(new Set(sheetJson.slice(1).map(row => row[0])))

  sheetJson.slice(1).forEach((row) => {
    const [className, studentNo, studentName, ...scores] = row
    scores.forEach((score: string, i: number) => {
      examScoreList.value.push({
        studentNo,
        studentName,
        className,
        subjectName: exam.value.subjectList?.[i] || '',
        score: NP.round(score),
      })
    })
  })

  console.log(exam.value.subjectList, 'subjectList')
  console.log(exam.value.classList, 'classList')
  console.log(examScoreList.value, 'examScoreList')
}

function nextStep1() {
  const lastIndex = uploadFile.value.name.lastIndexOf('.')
  if (lastIndex !== -1)
    exam.value.name = uploadFile.value.name.substring(0, lastIndex)

  exam.value.date = Date.now()
  activeStep.value = ++activeStep.value
}

function backStep1() {
  activeStep.value = --activeStep.value
}

function complete() {
  examDexie.exam.put({
    name: exam.value.name,
    date: exam.value.date,
    subjectList: JSON.stringify(exam.value.subjectList),
    classList: JSON.stringify(exam.value.classList),
    examScoreList: JSON.stringify(examScoreList.value),
  }).then(() => {
    reset()
    emit('complete')
  })
}

function reset() {
  activeStep.value = 1
  uploadFile.value = undefined
  headers.value = []
  rows.value = []
  exam.value = {}
  examScoreList.value = []
}

onMounted(() => {
  reset()
})
</script>

<template>
  <el-dialog
    :model-value="isShow"
    title="新增"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="1100"
    top="10vh"
    @close="() => emit('complete')"
  >
    <el-steps class="mb-4" :space="200" :active="activeStep" simple>
      <el-step title="新增" />
      <el-step title="设置" />
    </el-steps>
    <el-divider border-style="solid" />

    <!--  导入成绩 start  -->
    <el-upload
      v-if="activeStep === 1"
      ref="uploadRef"
      :before-upload="() => false"
      :auto-upload="false"
      :limit="1"
      accept=".xlsx, .xls"
      drag
      :on-change="importFile"
      :on-exceed="handleExceed"
    >
      <div class="el-upload__text">
        拖动文件到此处，或者 <em>点击选择</em>
      </div>
    </el-upload>
    <!--  导入成绩 end  -->

    <!--  设置成绩 start  -->
    <el-card v-else-if="activeStep === 2">
      <div h-50 :class="`h-${tableHeight}`">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              :columns="headers" :data="rows" :width="width" :height="height" :header-height="30"
              :row-height="30"
            />
          </template>
        </el-auto-resizer>
      </div>
    </el-card>
    <!--  设置成绩 end  -->

    <template #footer>
      <el-button
        v-if="activeStep === 1"
        :loading="nextStepLoading"
        @click="nextStep1"
      >
        下一步
      </el-button>
      <el-button v-if="activeStep === 2" @click="backStep1">
        上一步
      </el-button>
      <el-button v-if="activeStep === 2" @click="complete">
        完成
      </el-button>
    </template>
  </el-dialog>
</template>

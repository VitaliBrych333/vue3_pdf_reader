<script lang='ts'>
import '@tato30/vue-pdf/style.css';
import { VuePDF } from '@tato30/vue-pdf';

export default {
  props: [
    'scale',
    'isCompareView',
    'annotations',
    'isLatestPageDoc',
    'isLatestPageAllDocs',
    'isLastPageAllDocsLoaded',
    'page'
  ],

  emits: ['docsLoaded'],

  components: {
    VuePDF
  },

  data() {
    return {
      rotate: 0,
    }
  },

  methods: {
    onLoaded(value) {
      // console.log('onloaded-----------------', this.isLatestPageAllDocs, this.isLastPageAllDocsLoaded, value)
      if (this.isLatestPageAllDocs && !this.isLastPageAllDocsLoaded) {
        this.$emit('docsLoaded');
      }

      // storeDocument.documents
      // console.log('dddddddddd--------onLoaded', value)
      // console.log('dddddddddd--------onLoaded',  value, this.$refs.vuePDFRef.value)

      // console.log('dddddddddd--------onLoaded---vuePDFRef', this.$refs.vuePDFRef as HTMLElement)
      // storeDocument.usePdf.pdf.promise.then((value) => console.log('fffff', value.getPage(2).then((val) => console.log('dddd', val.ref))))

      //  storeDocument.usePdf.pdf.promise.then((value) => console.log('fffff', value.numPages))

      // console.log('fffffffffffffffff', this.$refs.wrapperPage.childNodes[0].childNodes[0])


      // const canvas = document.querySelector(`.document_id_${this.documentId}_page_number_${this.numberPage} > canvas`) as HTMLCanvasElement;

      const canvas = this.$refs.wrapperPage.firstChild.firstChild;

      // console.log('fffffffffffffffff', canvas)

      const context = canvas.getContext('2d');


      // console.log('ddddddddddddd', context)

      context.save();

      context.strokeStyle = '#FF0000';
      context.fillStyle = '#FF0000';

      this.drawArrow(context)

      // console.log('dddddddd---canvas', )
      context.restore();

      // storeDocument.usePdf.pdf.promise.then((value) => console.log('fffff', value.getPage(2)))


      // storeDocument.usePdf.pdf.promise.then((value) => console.log('fffff', value.canvasFactory.getContext('2d')))

      //  storeDocument.usePdf.pdf.promise.then(
      //   async (value) => {

      //     await value.annotationStorage.setValue("edit1",  {
      //         "annotationType": 3,
      //         "color": [0, 0, 0],
      //         "fontSize": 10,
      //         "value": "Hello World 66666666666666",
      //         "pageIndex": 0,
      //         "rect": [67.5, 543, 119, 55.5],
      //         "rotation": 0
      //       })
      //     // const page = await value.getPage(2);
      //     // const a = await page.getAnnotations();


      //     console.log('0000000000000', value )

      //   })
    },

    // for CompareView
    rotatePage(value: number) {
      this.rotate += value;

      if (this.rotate > 270 || this.rotate < -270) {
        this.rotate = 0;
      }
    },

    drawArrow(context) {
        // const borderWidth = 6 / this.scale;

        // const pointStart = {x: this.left, y: this.top}
        //     , pointEnd = {x: this.left + this.width, y: this.top + this.height};
        // const TIP_WIDTH = 30 / this.scale;
        // const TIP_HEIGHT = 40 / this.scale;
        // const length = Math.sqrt((pointStart.x - pointEnd.x) * (pointStart.x - pointEnd.x) + (pointStart.y - pointEnd.y) * (pointStart.y - pointEnd.y));
        // const angle = Math.atan2(pointEnd.y - pointStart.y, pointEnd.x - pointStart.x);

        const borderWidth = 3;

        const pointStart = {x: 30, y: 30}
            , pointEnd = {x: 40 + 50, y: 40 + 60};
        const TIP_WIDTH = 30 / 6;
        const TIP_HEIGHT = 40 / 6;
        const length = Math.sqrt((pointStart.x - pointEnd.x) * (pointStart.x - pointEnd.x) + (pointStart.y - pointEnd.y) * (pointStart.y - pointEnd.y));
        const angle = Math.atan2(pointEnd.y - pointStart.y, pointEnd.x - pointStart.x);

        context.beginPath();

        if (this.isExternal) {
            context.setLineDash(this.externalBorderDashesStyle);
            context.strokeStyle = this.externalBorderColor;
        }

        context.lineWidth = borderWidth;
        context.translate(pointStart.x, pointStart.y);
        context.rotate(angle);
        context.moveTo(0, 0);

        if (length <= 3 * TIP_WIDTH) {
            const tip = TIP_HEIGHT / TIP_WIDTH * length / 3;

            context.lineTo(length * 2 / 3, -tip / 4);
            context.lineTo(length * 2 / 3, -tip / 2);
            context.lineTo(length, 0);
            context.lineTo(length * 2 / 3, tip / 2);
            context.lineTo(length * 2 / 3, tip / 4);
        } else {
            context.lineTo(length - TIP_WIDTH, -TIP_HEIGHT / 4);
            context.lineTo(length - TIP_WIDTH, -TIP_HEIGHT / 2);
            context.lineTo(length, 0);
            context.lineTo(length - TIP_WIDTH, TIP_HEIGHT / 2);
            context.lineTo(length - TIP_WIDTH, TIP_HEIGHT / 4);
        }

        context.lineTo(0, 0);
        context.stroke();
        context.fill();
    }
  },
}
</script>

<template>
  <div
    :id="page.pageId"
    class="wrapper-page"
    ref="wrapperPage"
  >
    <VuePDF
      ref="vuePDFRef"
      :pdf="page.url"
      :page="page.originalNumPage"
      :rotation="isCompareView ? rotate : page.rotate"
      :scale="scale"
      :annotation-layer="annotations"
      @loaded="onLoaded"
    />
  </div>
</template>

<style scoped>
.active-page .wrapper-page, .wrapper-page:hover {
  box-shadow: 0 10px 16px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.active-page .wrapper-page {
  border: 3px solid #E53935 !important;
}

.edit-page .wrapper-page {
  opacity: 0.5;
}

</style>

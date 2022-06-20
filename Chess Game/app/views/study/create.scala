package views.html.study

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.study.Study

import controllers.routes

object create {

  private def studyButton(s: Study.IdName) =
    submitButton(name := "as", value := s.id.value, cls := "submit button")(s.name.value)

  def apply(
      data: lila.study.StudyForm.importGame.Data,
      owner: List[Study.IdName],
      contrib: List[Study.IdName],
      editorUrl: (chess.format.FEN, chess.variant.Variant) => String
  )(implicit ctx: Context) =
    views.html.site.message(
      title = trans.toStudy.txt(),
      icon = Some(""),
      back = data.fen.map(fen => editorUrl(fen, data.variant | chess.variant.Variant.default)),
      moreCss = cssTag("study.create").some
    ) {
      div(cls := "study-create")(
        postForm(action := routes.Study.create)(
          input(tpe     := "hidden", name := "gameId", value      := data.gameId),
          input(tpe     := "hidden", name := "orientation", value := data.orientation.map(_.key)),
          input(tpe     := "hidden", name := "fen", value         := data.fen.map(_.value)),
          input(tpe     := "hidden", name := "pgn", value         := data.pgnStr),
          input(tpe     := "hidden", name := "variant", value     := data.variant.map(_.key)),
          h2(trans.study.whereDoYouWantToStudyThat()),
          p(
            submitButton(
              name     := "as",
              value    := "study",
              cls      := "submit button large new text",
              dataIcon := ""
            )(trans.study.createStudy())
          ),
          div(cls := "studies")(
            div(
              h2(trans.study.myStudies()),
              owner map studyButton
            ),
            div(
              h2(trans.study.studiesIContributeTo()),
              contrib map studyButton
            )
          )
        )
      )
    }
}

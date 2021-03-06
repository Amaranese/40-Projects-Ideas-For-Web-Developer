package lila

import org.joda.time.DateTime

package object challenge extends PackageObject {

  private[challenge] def inTwoWeeks = DateTime.now plusWeeks 2

  private[challenge] val logger = lila log "challenge"
}

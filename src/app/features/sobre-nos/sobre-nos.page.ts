import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  bulbOutline,
  cutOutline,
  moonOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  storefrontOutline,
  sunnyOutline,
  timeOutline,
} from 'ionicons/icons';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-sobre-nos',
  templateUrl: './sobre-nos.page.html',
  styleUrls: ['./sobre-nos.page.scss'],
  imports: [RouterLink, IonButton, IonContent, IonHeader, IonIcon, IonToolbar],
})
export class SobreNosPage {
  protected readonly theme = inject(ThemeService);

  constructor() {
    addIcons({
      'arrow-forward-outline': arrowForwardOutline,
      'bulb-outline': bulbOutline,
      'cut-outline': cutOutline,
      'moon-outline': moonOutline,
      'people-outline': peopleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'storefront-outline': storefrontOutline,
      'sunny-outline': sunnyOutline,
      'time-outline': timeOutline,
    });
  }
}

import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-solicitacoes-filiacao',
  templateUrl: './solicitacoes-filiacao.page.html',
  styleUrls: ['./solicitacoes-filiacao.page.scss'],
  imports: [
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export class SolicitacoesFiliacaoPage {
  constructor() {
    addIcons({ 'people-outline': peopleOutline });
  }
}

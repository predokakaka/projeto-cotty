import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  locationOutline,
  searchOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { BarbeariaService } from '../../core/services/barbearia';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { normalizarTexto } from '../../shared/utils/texto';

interface BarbeariaEncontrada extends Barbearia {
  busca: string;
}

@Component({
  selector: 'app-filiacao',
  templateUrl: './filiacao.page.html',
  styleUrls: ['./filiacao.page.scss'],
  imports: [
    IonBackButton,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSkeletonText,
    IonTitle,
    IonToolbar,
  ],
})
export class FiliacaoPage {
  private readonly barbeariaService = inject(BarbeariaService);
  private readonly router = inject(Router);

  protected todasBarbearias: BarbeariaEncontrada[] = [];
  protected barbearias: BarbeariaEncontrada[] = [];
  protected termoBusca = '';
  protected carregando = true;
  protected comErro = false;

  constructor() {
    addIcons({
      'information-circle-outline': informationCircleOutline,
      'location-outline': locationOutline,
      'search-outline': searchOutline,
      'storefront-outline': storefrontOutline,
    });
  }

  public ionViewWillEnter() {
    this.buscarBarbearias();
  }

  protected atualizar(evento: any) {
    this.buscarBarbearias(() => evento.target.complete());
  }

  protected filtrar(evento?: CustomEvent<{ value?: string | null }>) {
    if (evento?.detail?.value !== undefined) {
      this.termoBusca = evento.detail.value ?? '';
    }

    const termo = normalizarTexto(this.termoBusca).trim();
    this.barbearias = termo
      ? this.todasBarbearias.filter((barbearia) => barbearia.busca.includes(termo))
      : this.todasBarbearias;
  }

  protected limparBusca() {
    this.termoBusca = '';
    this.barbearias = this.todasBarbearias;
  }

  protected visualizarDetalhes(barbearia: Barbearia) {
    if (barbearia.barbearia_id) {
      this.router.navigate(['/barbearia', barbearia.barbearia_id]);
    }
  }

  protected abrirSolicitacoes() {
    this.router.navigate(['/solicitacoes-filiacao']);
  }

  private buscarBarbearias(aoFinalizar?: () => void) {
    this.carregando = true;
    this.comErro = false;
    this.barbeariaService.getBarbearias().subscribe({
      next: (dados) => {
        this.todasBarbearias = (Array.isArray(dados) ? dados : []).map((barbearia) => ({
          ...barbearia,
          busca: normalizarTexto(barbearia.nomeFantasia),
        }));
        this.filtrar();
        this.carregando = false;
        aoFinalizar?.();
      },
      error: () => {
        this.comErro = true;
        this.carregando = false;
        aoFinalizar?.();
      },
    });
  }
}

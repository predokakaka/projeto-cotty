import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonImg,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonButton,
  IonFab,
  IonFabButton,
  IonModal,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  cutOutline,
  storefrontOutline,
  searchOutline,
  addOutline,
  closeOutline,
  personAddOutline,
  moonOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { BarbeariaService } from '../../core/services/barbearia';
import { ThemeService } from '../../core/services/theme.service';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { normalizarTexto } from '../../shared/utils/texto';

interface BarbeariaItem extends Barbearia {
  _busca: string;
}

@Component({
  selector: 'app-barbearias',
  templateUrl: 'barbearias.page.html',
  styleUrls: ['barbearias.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonImg,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonButton,
    IonFab,
    IonFabButton,
    IonModal,
  ],
})
export class BarbeariasPage {
  private barbeariaService = inject(BarbeariaService);
  private router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected todasBarbearias: BarbeariaItem[] = [];
  protected barbearias: BarbeariaItem[] = [];
  protected termoBusca = '';
  protected carregando = true;
  protected comErro = false;
  protected opcoesAbertas = false;

  constructor() {
    addIcons({
      'location-outline': locationOutline,
      'cut-outline': cutOutline,
      'storefront-outline': storefrontOutline,
      'search-outline': searchOutline,
      'add-outline': addOutline,
      'close-outline': closeOutline,
      'person-add-outline': personAddOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
    });
  }

  public ionViewDidEnter() {
    this.buscarBarbearias();
  }

  protected atualizar(evento: any) {
    this.buscarBarbearias(() => evento.target.complete());
  }

  protected abrirBarbearia(barbearia: Barbearia) {
    if (!barbearia.barbearia_id) return;
    this.router.navigate(['/barbearia', barbearia.barbearia_id]);
  }

  protected fecharOpcoes() {
    this.opcoesAbertas = false;
  }

  protected aoFecharModal() {
    this.opcoesAbertas = false;
  }

  protected abrirOpcoes() {
    this.opcoesAbertas = true;
  }

  protected async cadastrarBarbearia() {
    this.fecharOpcoes();
    await this.router.navigate(['/cadastro-barbearia']);
  }

  protected async encontrarFiliacao() {
    this.fecharOpcoes();
      await this.router.navigate(['/filiacao']);
  }

  protected filtrar(evento?: CustomEvent) {
    if (evento?.detail?.value !== undefined) {
      this.termoBusca = evento.detail.value;
    }

    const termo = normalizarTexto(this.termoBusca).trim();
    this.barbearias = termo
      ? this.todasBarbearias.filter((b) => b._busca.includes(termo))
      : this.todasBarbearias;
  }

  protected limparBusca() {
    this.termoBusca = '';
    this.barbearias = this.todasBarbearias;
  }

  private buscarBarbearias(aoFinalizar?: () => void) {
    this.comErro = false;
    this.barbeariaService.getBarbearias().subscribe({
      next: (dados) => {
        const lista = Array.isArray(dados) ? dados : [];
        this.todasBarbearias = lista.map((b) => ({
          ...b,
          _busca: `${normalizarTexto(b.nomeFantasia)} ${normalizarTexto(b.endereco)} ${normalizarTexto(b.cidade)}`,
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

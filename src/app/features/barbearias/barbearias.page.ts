import { Component, ElementRef, ViewChild, inject } from '@angular/core';
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
  arrowForwardOutline,
  locationOutline,
  cutOutline,
  storefrontOutline,
  searchOutline,
  addOutline,
  closeOutline,
  personAddOutline,
  moonOutline,
  sunnyOutline,
  callOutline,
  peopleOutline,
} from 'ionicons/icons';
import { BarbeariaService } from '../../core/services/barbearia';
import { ThemeService } from '../../core/services/theme.service';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { normalizarTexto } from '../../shared/utils/texto';
import type { RefresherCustomEvent } from '@ionic/core';

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
  private dadosCarregados = false;
  private requisicaoEmAndamento = false;

  @ViewChild(IonContent) private conteudo?: IonContent;
  @ViewChild('listaEstabelecimentos', { read: ElementRef })
  private listaEstabelecimentos?: ElementRef<HTMLElement>;

  protected todasBarbearias: BarbeariaItem[] = [];
  protected barbearias: BarbeariaItem[] = [];
  protected termoBusca = '';
  protected carregando = true;
  protected comErro = false;
  protected opcoesAbertas = false;

  constructor() {
    addIcons({
      'arrow-forward-outline': arrowForwardOutline,
      'location-outline': locationOutline,
      'cut-outline': cutOutline,
      'storefront-outline': storefrontOutline,
      'search-outline': searchOutline,
      'add-outline': addOutline,
      'close-outline': closeOutline,
      'person-add-outline': personAddOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
      'call-outline': callOutline,
      'people-outline': peopleOutline,
    });
  }

  public ionViewDidEnter() {
    if (!this.dadosCarregados) {
      this.buscarBarbearias();
    }
  }

  protected atualizar(evento: RefresherCustomEvent) {
    this.buscarBarbearias(() => evento.target.complete(), true);
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

  protected buscarNovamente() {
    this.buscarBarbearias(undefined, true);
  }

  protected async explorarEstabelecimentos() {
    const alvo = this.listaEstabelecimentos?.nativeElement;
    const conteudo = this.conteudo;
    if (!alvo || !conteudo) return;

    const areaRolagem = await conteudo.getScrollElement();
    const distancia = alvo.getBoundingClientRect().top - areaRolagem.getBoundingClientRect().top;
    await conteudo.scrollToPoint(0, areaRolagem.scrollTop + distancia, 350);
  }

  private buscarBarbearias(aoFinalizar?: () => void, forcar = false) {
    if (this.requisicaoEmAndamento) {
      aoFinalizar?.();
      return;
    }
    if (this.dadosCarregados && !forcar) {
      aoFinalizar?.();
      return;
    }

    this.requisicaoEmAndamento = true;
    this.carregando = true;
    this.comErro = false;
    this.barbeariaService.getBarbearias().subscribe({
      next: (barbearias) => {
        this.todasBarbearias = (Array.isArray(barbearias) ? barbearias : []).map((barbearia) => ({
          ...barbearia,
          _busca: [barbearia.nomeFantasia, barbearia.endereco]
            .map((texto) => normalizarTexto(texto))
            .join(' '),
        }));
        this.filtrar();
        this.dadosCarregados = true;
        this.carregando = false;
        this.requisicaoEmAndamento = false;
        aoFinalizar?.();
      },
      error: () => {
        this.comErro = true;
        this.carregando = false;
        this.requisicaoEmAndamento = false;
        aoFinalizar?.();
      },
    });
  }
}

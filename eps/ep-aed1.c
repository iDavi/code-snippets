#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>

#define TAMANHO 10000

typedef struct _no_
{

    char *valor;
    int nOcr;
    struct _no_ *lOcr;
    struct _no_ *proximo;

} l_no;

typedef struct
{

    l_no *primeiro;
    int tamanho;

} ListaLigada;

typedef struct _no_arvore_
{

    char *valor;
    int nOcr;
    l_no *lOcr;
    struct _no_arvore_ *esq;
    struct _no_arvore_ *dir;

} No;

typedef struct
{

    No *raiz;
    int tamanho;

} Arvore;

char *minusculo(char *str)
{ //acho que essa funcao ja nao ta mais fazendo diferenca, pq eu troquei pela outra, mas mantive ela aqui pra evitar dar problema
    int tamanho = strlen(str);
    char *resultado = (char *)malloc((tamanho) * sizeof(char));
    if (resultado == NULL)
    {
        return NULL;
    }
    for (int i = 0; i < tamanho; i++)
    {
        resultado[i] = tolower(str[i]);
    }
    return resultado;
}
char *normaliza_string(const char *str) {
    int tamanho = strlen(str);
    char *resultado = (char *)malloc((tamanho + 1) * sizeof(char));
    if (resultado == NULL) {
        return NULL;
    }
    int j = 0;
    for (int i = 0; i < tamanho; i++) {
        if (isalpha((unsigned char)str[i])) {
            resultado[j++] = tolower((unsigned char)str[i]);
        }
    }
    resultado[j] = '\0';
    return resultado;
}

void adicionarpalavra_lista(ListaLigada *lista, char *palavra, l_no *linha)
{
    palavra = normaliza_string(palavra);
    l_no *trail = lista->primeiro;
    
    while (trail != NULL)
    {
        if (strcmp(trail->valor, palavra) == 0)
        {
            trail->nOcr++;
            l_no *occurance = trail->lOcr;
            while (occurance != NULL)
            {
                if (strcmp(occurance->valor, linha->valor) == 0)
                {
                    return;
                }
                if (occurance->proximo == NULL)
                {
                    break;
                }
                occurance = occurance->proximo;
            }
            l_no *novo_oc = (l_no *)malloc(sizeof(l_no));
            novo_oc->valor = strdup(linha->valor);
            novo_oc->lOcr = NULL;
            novo_oc->proximo = NULL;
            occurance->proximo = novo_oc;
            return;
        }
        trail = trail->proximo;
    }

    l_no *nova_palavra = (l_no *)malloc(sizeof(l_no));
    nova_palavra->valor = strdup(palavra);
    nova_palavra->lOcr = (l_no *)malloc(sizeof(l_no));
    nova_palavra->lOcr->valor = strdup(linha->valor);
    nova_palavra->lOcr->proximo = NULL;
    nova_palavra->lOcr->lOcr = NULL;
    nova_palavra->proximo = lista->primeiro;
    lista->primeiro = nova_palavra;
    lista->tamanho++;
}

void adicionarpalavra_arvore(Arvore *arvore, char *palavra, l_no *linha)
{
    palavra = minusculo(palavra);
    palavra = normaliza_string(palavra);
    No **atual = &(arvore->raiz);
    while (*atual != NULL)
    {
        int comparacao = strcmp(palavra, (*atual)->valor);
        if (comparacao == 0)
        {
            (*atual)->nOcr++;
            if ((*atual)->lOcr == NULL)
            { 
                (*atual)->lOcr = (l_no *)malloc(sizeof(l_no));
                (*atual)->lOcr->valor = strdup(linha->valor);
                (*atual)->lOcr->proximo = NULL;
                (*atual)->lOcr->lOcr = NULL;
                return;
            }
            l_no *ocorrencia = (*atual)->lOcr;
            while (ocorrencia != NULL)
            {
                if (strcmp(ocorrencia->valor, linha->valor) == 0)
                {
                    return;
                }
                if (ocorrencia->proximo == NULL)
                {
                    break;
                }
                ocorrencia = ocorrencia->proximo;
            }
            l_no *nova_ocorrencia = (l_no *)malloc(sizeof(l_no));
            nova_ocorrencia->valor = strdup(linha->valor);
            nova_ocorrencia->proximo = NULL;
            ocorrencia->proximo = nova_ocorrencia;
            return;
        }
        else if (comparacao < 0)
        {
            atual = &((*atual)->esq);
        }
        else
        {
            atual = &((*atual)->dir);
        }
    }
    No *novo_no = (No *)malloc(sizeof(No));
    novo_no->valor = strdup(palavra);
    novo_no->nOcr = 1;
    novo_no->lOcr = (l_no *)malloc(sizeof(l_no));
    novo_no->lOcr->valor = strdup(linha->valor);
    novo_no->lOcr->proximo = NULL;
    novo_no->esq = NULL;
    novo_no->dir = NULL;
    *atual = novo_no;
    arvore->tamanho++;
}

ListaLigada *cria_lista()
{

    ListaLigada *lista = (ListaLigada *)malloc(sizeof(ListaLigada));
    lista->primeiro = NULL;
    lista->tamanho = 0;

    return lista;
}

void imprimir_lista(ListaLigada *lista)
{
    l_no *atual = lista->primeiro;
    while (atual != NULL)
    {
        printf("palavrinha '%s'\n", atual->valor);
        l_no *oc = atual->lOcr;
        while (oc != NULL)
        {
            printf("\tta parecendo em %s\n", oc->valor);
            oc = oc->proximo;
        }
        atual = atual->proximo;
    }
}

void busca_lista(ListaLigada *lista, char *palavra) {
    palavra = normaliza_string(palavra);
    clock_t inicio = clock();
    l_no *atual = lista->primeiro;

    while (atual != NULL) {
        if (strcmp(atual->valor, palavra) == 0) {
            clock_t fim = clock();
            double tempo_busca = (double)(fim - inicio) * 1000.0 / CLOCKS_PER_SEC;
            printf("Existem %d ocorrências da palavra '%s' na(s) seguinte(s) linha(s):\n", atual->nOcr+1, palavra);
            l_no *ocorrencia = atual->lOcr;
            while (ocorrencia != NULL) {
                printf("%s\n", ocorrencia->valor);
                ocorrencia = ocorrencia->proximo;
            }
            printf("Tempo de busca: %.2f ms\n", tempo_busca);
            return; 
        }
        atual = atual->proximo;
    }

    clock_t fim = clock();
    double tempo_busca = (double)(fim - inicio) * 1000.0 / CLOCKS_PER_SEC;
    printf("Palavra '%s' não encontrada.\n", palavra);
    printf("Tempo de busca: %.2f ms\n", tempo_busca);
}

void busca_arvore(Arvore *arvore, char *palavra)
{
    palavra = normaliza_string(palavra);
    clock_t inicio = clock();
    No *atual = arvore->raiz;
    while (atual != NULL)
    {
        int comparacao = strcmp(palavra, atual->valor);
        if (comparacao == 0)
        {
            clock_t fim = clock();
            double tempo_busca = (double)(fim - inicio) * 1000.0 / CLOCKS_PER_SEC;
            printf("Existem %d ocorrências da palavra '%s' na(s) seguinte(s) linha(s):\n", atual->nOcr, palavra);
            l_no *ocorrencia = atual->lOcr;
            while (ocorrencia != NULL)
            {
                printf("%s\n", ocorrencia->valor);
                ocorrencia = ocorrencia->proximo;
            }
            printf("Tempo de busca: %.2f ms\n", tempo_busca);
            return;
        }
        else if (comparacao < 0)
        {
            atual = atual->esq;
        }
        else
        {
            atual = atual->dir;
        }
    }
    clock_t fim = clock();
    double tempo_busca = (double)(fim - inicio) * 1000.0 / CLOCKS_PER_SEC;
    printf("Palavra '%s' não encontrada.\n", palavra);
    printf("Tempo de busca: %.2f ms\n", tempo_busca);
}

int altura_arvore(No *raiz)
{ // professor desculpa por isso
    if (raiz == NULL)
    {
        return -1;
    }
    int altura_esq = altura_arvore(raiz->esq);
    int altura_dir = altura_arvore(raiz->dir);
    return (altura_esq > altura_dir ? altura_esq : altura_dir) + 1;
}

int main(int argc, char **argv)
{

    FILE *in;
    char *linha;
    char *copia_ponteiro_linha;
    char *quebra_de_linha;
    char *palavra;
    int contador_linha;

    if (argc == 3)
    {

        in = fopen(argv[1], "r");

        contador_linha = 0;
        linha = (char *)malloc((TAMANHO + 1) * sizeof(char));
        printf("\nArquivo: %s", argv[1]);
        printf("\nTipo de indice: %s", argv[2]);
        ListaLigada *list = cria_lista();
        Arvore *arvore = (Arvore *)malloc(sizeof(Arvore));
        arvore->raiz = NULL;
        arvore->tamanho = 0;

        int contador_palavra = 0;

        clock_t inicio = clock();
        while (in && fgets(linha, TAMANHO, in))
        {

            if ((quebra_de_linha = strrchr(linha, '\n')))
                *quebra_de_linha = 0;

            char nova_linha[TAMANHO];
            sprintf(nova_linha, "%05d: %s", contador_linha + 1, linha);

            l_no *linhaobj = (l_no *)malloc(sizeof(l_no));
            linhaobj->valor = strdup(nova_linha);
            linhaobj->lOcr = NULL;
            linhaobj->nOcr = 0;
            linhaobj->proximo = NULL;

            // fazemos uma copia do endereço que corresponde ao array de chars
            // usado para armazenar cada linha lida do arquivo pois a função 'strsep'
            // modifica o endereço do ponteiro a cada chamada feita a esta função (e
            // não queremos que 'linha' deixe de apontar para o inicio do array).

            copia_ponteiro_linha = linha;

            while ((palavra = strsep(&copia_ponteiro_linha, " ")))
            {

                // antes de guardar a palavra em algum tipo de estrutura usada
                // para implementar o índice, será necessário fazer uma copia
                // da mesma, uma vez que o ponteiro 'palavra' aponta para uma
                // substring dentro da string 'linha', e a cada nova linha lida
                // o conteúdo da linha anterior é sobreescrito.

                if (strchr(palavra, '-') != NULL)
                {
                    char *temp = strdup(palavra);
                    char *subpalavra;

                    while ((subpalavra = strsep(&temp, "-")) != NULL)
                    {
                        if (strlen(subpalavra) > 0)
                        {
                            if (strcmp(argv[2], "lista") == 0)
                            {
                                adicionarpalavra_lista(list, subpalavra, linhaobj);
                            }
                            else if (strcmp(argv[2], "arvore") == 0)
                            {
                                adicionarpalavra_arvore(arvore, subpalavra, linhaobj);
                            }
                            contador_palavra++;
                        }
                    }
                    free(temp);
                }
                else
                {
                    if (strlen(palavra) > 0)
                    {
                        if (strcmp(argv[2], "lista") == 0)
                        {
                            adicionarpalavra_lista(list, palavra, linhaobj);
                        }
                        else if (strcmp(argv[2], "arvore") == 0)
                        {
                            adicionarpalavra_arvore(arvore, palavra, linhaobj);
                        }
                        contador_palavra++;
                    }
                }
            }

            contador_linha++;
        }
        //imprimir_lista(list);
        clock_t fim = clock();
        double tempo_execucao = (double)(fim - inicio) * 1000.0 / CLOCKS_PER_SEC;
        printf("\nNumero de linhas do arquivo: %d\n", contador_linha + 1);
        printf("Total de palavras: %d\n", contador_palavra);

        if (strcmp(argv[2], "lista") == 0)
        {
            printf("Tamanho da lista: %d\n", list->tamanho);
        }
        if (strcmp(argv[2], "arvore") == 0)
        {
            printf("Altura da arvore:% d\n", altura_arvore(arvore->raiz)); // professor perdão por essa heresia kkkk
        }

        printf("Tempo de carga do arquivo e construcao do indice: %.2f ms\n", tempo_execucao);

        char comando[42];
        while (1)
        {
            printf("> ");
            fgets(comando, 42, stdin);
            comando[strcspn(comando, "\n")] = 0;

            if (strncmp(comando, "busca ", 6) == 0)
            {
                char *termo = comando + 6;

                if (strncmp(comando, "busca ", 6) == 0)
                {
                    char *termo = comando + 6;
                    if (strcmp(argv[2], "arvore") == 0)
                    {
                        busca_arvore(arvore, termo);
                    }
                    else if (strcmp(argv[2], "lista") == 0)
                    {
                        busca_lista(list, termo);
                    }
                }
            }
            else if (strcmp(comando, "fim") == 0)
            {
                break;
            }
            else
            {
                printf("Opcao invalida!\n");
            }
        }

        return 0;
    }

    return 1;
}

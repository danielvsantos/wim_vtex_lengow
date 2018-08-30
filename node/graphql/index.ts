interface ProductsForm {
  id: string
  name: string
}

class ProductsFormDatabase {
  private idCounter = 0
  private productsForm: ProductsForm[] = []

  constructor() {
    this.productsForm.push({
      id: this.newID(),
      name: 'Default Cached Book',
    })
  }

  private newID(): string {
    return (this.idCounter++).toString()
  }

  public get(): ProductsForm[] {
    return this.productsForm
  }

  public getById(id: string): ProductsForm {
    return this.productsForm.find((productsForm) => productsForm.id === id)
  }

  public delete(id: string): boolean {
    const index = this.productsForm.findIndex((productsForm) => productsForm.id === id)

    if (index != -1) {
      this.productsForm.splice(index, 1)
      return true
    }
    return false
  }

  public add({name}) {
    const productsForm: ProductsForm = {
      name,
      id: this.newID()
    }
    this.productsForm.push(productsForm)
    return productsForm
  }
}

const mock = new ProductsFormDatabase()

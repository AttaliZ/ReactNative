  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Insert New Product</Text>

      <TextInput
        style={styles.input}
        placeholder="Product Name *"
        value={form.name}
        onChangeText={text => handleChange('name', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={form.price}
        onChangeText={text => handleChange('price', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Stock"
        keyboardType="numeric"
        value={form.stock}
        onChangeText={text => handleChange('stock', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={form.category}
        onChangeText={text => handleChange('category', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={form.location}
        onChangeText={text => handleChange('location', text)}
      />
      <TextInput 
        style={styles.input}
        placeholder="Brand"
        value={form.brand}
        onChangeText={text => handleChange('brand', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Sizes (e.g. US 7,8,9)"
        value={form.sizes}
        onChangeText={text => handleChange('sizes', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Product Code"
        value={form.productCode}
        onChangeText={text => handleChange('productCode', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Order Name"
        value={form.orderName}
        onChangeText={text => handleChange('orderName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Image URL"
        value={form.image}
        onChangeText={text => handleChange('image', text)}
      />

      <Button title="Save Product" onPress={createProduct} />
    </ScrollView>
  );
}
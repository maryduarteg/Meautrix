using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("medidas")]
    public class Medida
    {
        [Key]
        [Column("med_id")]
        public int MedId { get; set; }

        [Required(ErrorMessage = "A descrição da medida é obrigatório.")]
        [Column("med_descricao")]
        [StringLength(30)]
        public string MedDescricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "A sigla da medida é obrigatório.")]
        [Column("med_sigla")]
        [StringLength(10)] 
        public string MedSigla { get; set; } = string.Empty;


        /// <summary>
        /// Indicador de situação da medida: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("med_ativo")]
        public string MedAtivo { get; set; }
    }
}

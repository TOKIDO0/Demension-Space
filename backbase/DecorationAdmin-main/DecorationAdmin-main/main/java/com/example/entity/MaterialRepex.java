package com.example.entity;

import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

import java.util.List;

@Data
public class MaterialRepex extends Model<MaterialRepex> {
    private List<MaterialRep> materialReps;
    private Integer moneyinall;
}
